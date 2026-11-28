import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import {
  createSubmissionFingerprint,
  isDuplicateSubmission,
  validateSubmission,
  type SubmissionPayload,
} from './src/utils/churchLogic.ts';
import {
  getDefaultMemberFormConfig,
  parseGoogleFormUrl,
  type MemberFormConfig,
} from './src/utils/memberFormLogic.ts';
import { rankFacebookVideos, type VideoSortMode } from './src/utils/facebookVideoLogic.ts';
import {
  getRankedFacebookVideos,
  getSafeThumbFilePath,
  startAutomaticFacebookVideoSync,
  subscribeToFacebookVideoUpdates,
  syncFacebookVideosNow,
} from './src/services/facebookVideos.ts';
import {
  buildTransferNarration,
  createGivingFingerprint,
  getDefaultGivingConfig,
  isValidAccountNumber,
  normalizeAccountNumber,
  validateGivingSubmission,
  type GivingConfig,
  type GivingSubmissionInput,
} from './src/utils/givingLogic.ts';
import {
  buildGivingEmailContent,
  buildSubmissionEmailContent,
  dispatchChurchEmail,
} from './src/services/emailNotifier.ts';

interface StoredSubmission {
  id: string;
  submittedAt: string;
  payload: SubmissionPayload;
}

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const MEMBER_FORM_CONFIG_FILE = path.join(DATA_DIR, 'member-form-config.json');
const GIVINGS_FILE = path.join(DATA_DIR, 'givings.json');

interface StoredGivingRecord {
  id: string;
  submittedAt: string;
  narration: string;
  payload: Omit<GivingSubmissionInput, 'website'>;
}

async function readGivingConfig(): Promise<GivingConfig> {
  const envBank = (process.env.CHURCH_BANK_NAME || '').trim();
  const envAccountNumber = normalizeAccountNumber(process.env.CHURCH_ACCOUNT_NUMBER || '');
  const envAccountName =
    (process.env.CHURCH_ACCOUNT_NAME || '').trim() || "God's Palace Evangelical Ministry Worldwide";

  if (envBank.length >= 2 && isValidAccountNumber(envAccountNumber)) {
    return {
      primaryAccount: {
        bankName: envBank,
        accountName: envAccountName,
        accountNumber: envAccountNumber,
      },
      transferInstructions: getDefaultGivingConfig().transferInstructions,
      isConfigured: true,
      updatedAt: new Date().toISOString(),
      source: 'env',
    };
  }

  return getDefaultGivingConfig();
}

async function persistGivingRecord(entry: StoredGivingRecord): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let existing: StoredGivingRecord[] = [];
  try {
    const raw = await fs.readFile(GIVINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      existing = parsed as StoredGivingRecord[];
    }
  } catch {
    existing = [];
  }
  existing.push(entry);
  await fs.writeFile(GIVINGS_FILE, JSON.stringify(existing, null, 2), 'utf8');
}

async function readMemberFormConfig(): Promise<MemberFormConfig> {
  const envUrl = (process.env.MEMBER_GOOGLE_FORM_URL || '').trim();
  if (envUrl) {
    const parsedEnv = parseGoogleFormUrl(envUrl);
    if (parsedEnv.valid) {
      return {
        viewUrl: parsedEnv.viewUrl,
        embedUrl: parsedEnv.embedUrl,
        formTitle: "God's Palace Member Registration Form",
        updatedAt: new Date().toISOString(),
        isDefault: false,
      };
    }
  }
  try {
    const raw = await fs.readFile(MEMBER_FORM_CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as MemberFormConfig;
    if (parsed && parsed.viewUrl && parseGoogleFormUrl(parsed.viewUrl).valid) {
      return { ...parsed, isDefault: false };
    }
  } catch {
    // No custom override saved; fall back to built-in official church Google Form
  }
  return getDefaultMemberFormConfig();
}

async function writeMemberFormConfig(config: MemberFormConfig): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(MEMBER_FORM_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

// In-memory duplicate & simple rate-limit trackers (protects against spam/double submits)
const recentFingerprints = new Map<string, number>();
const ipRequestLog = new Map<string, number[]>();

function isRateLimited(ip: string, nowMs: number): boolean {
  const windowMs = 60_000;
  const maxPerMinute = 10;
  const timestamps = (ipRequestLog.get(ip) ?? []).filter((ts) => nowMs - ts <= windowMs);
  if (timestamps.length >= maxPerMinute) {
    ipRequestLog.set(ip, timestamps);
    return true;
  }
  timestamps.push(nowMs);
  ipRequestLog.set(ip, timestamps);
  return false;
}

async function persistSubmission(entry: StoredSubmission): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let existing: StoredSubmission[] = [];
  try {
    const raw = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      existing = parsed;
    }
  } catch {
    existing = [];
  }
  existing.push(entry);
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(existing, null, 2), 'utf8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'church-website' });
  });

  app.get('/api/videos', async (req, res) => {
    const rawSort = typeof req.query.sort === 'string' ? req.query.sort : 'latest';
    const sortMode: VideoSortMode =
      rawSort === 'popular' || rawSort === 'duration' ? rawSort : 'latest';
    try {
      const feed = await getRankedFacebookVideos(sortMode);
      res.json({ ok: true, sortMode, ...feed });
    } catch (err) {
      console.error('Failed to serve Facebook videos:', err);
      res.status(500).json({ ok: false, error: 'Unable to load church videos right now.' });
    }
  });

  let lastManualSyncMs = 0;
  app.post('/api/videos/sync', async (req, res) => {
    const rawSort = typeof req.query.sort === 'string' ? req.query.sort : 'latest';
    const sortMode: VideoSortMode =
      rawSort === 'popular' || rawSort === 'duration' ? rawSort : 'latest';
    const nowMs = Date.now();
    if (nowMs - lastManualSyncMs < 5_000) {
      const feed = await getRankedFacebookVideos(sortMode);
      res.json({ ok: true, throttled: true, ...feed });
      return;
    }
    lastManualSyncMs = nowMs;
    try {
      const snapshot = await syncFacebookVideosNow();
      const feed = await getRankedFacebookVideos(sortMode);
      res.json({
        ok: true,
        newVideoIds: snapshot.newVideoIds ?? [],
        ...feed,
      });
    } catch (err) {
      console.error('Failed to sync Facebook videos:', err);
      res.status(500).json({ ok: false, error: 'Unable to sync Facebook videos right now.' });
    }
  });

  // Real-time Server-Sent Events stream so open pages immediately show newly detected Facebook videos
  app.get('/api/videos/stream', (req, res) => {
    const rawSort = typeof req.query.sort === 'string' ? req.query.sort : 'latest';
    const sortMode: VideoSortMode =
      rawSort === 'popular' || rawSort === 'duration' ? rawSort : 'latest';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (eventName: string, payload: unknown) => {
      res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    sendEvent('connected', { ok: true, listenerIntervalSeconds: 45 });

    const unsubscribe = subscribeToFacebookVideoUpdates((snapshot) => {
      sendEvent('videos-updated', {
        ok: true,
        sortMode,
        videos: rankFacebookVideos(snapshot.videos, sortMode),
        lastSyncedAt: snapshot.lastSyncedAt,
        syncSource: snapshot.syncSource,
        facebookPageUrl: snapshot.facebookPageUrl,
        facebookVideosUrl: snapshot.facebookVideosUrl,
        newVideoIds: snapshot.newVideoIds ?? [],
        listenerIntervalSeconds: snapshot.listenerIntervalSeconds ?? 45,
        ...(snapshot.aiError ? { aiError: snapshot.aiError } : {}),
      });
    });

    const keepaliveTimer = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 25_000);

    req.on('close', () => {
      clearInterval(keepaliveTimer);
      unsubscribe();
      res.end();
    });
  });

  // Optional Meta Page Webhook endpoint for zero-delay push notifications if configured later
  app.get('/api/webhooks/facebook', (req, res) => {
    const verifyToken = (process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || '').trim();
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (verifyToken && mode === 'subscribe' && token === verifyToken && typeof challenge === 'string') {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).end();
  });

  app.post('/api/webhooks/facebook', (_req, res) => {
    // Acknowledge Meta webhook promptly and trigger immediate background sync
    res.status(200).json({ received: true });
    void syncFacebookVideosNow().catch(() => {});
  });

  app.get('/api/video-thumbs/:id', async (req, res) => {
    const filePath = getSafeThumbFilePath(req.params.id);
    if (!filePath) {
      res.status(400).end();
      return;
    }
    try {
      await fs.access(filePath);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.sendFile(filePath);
    } catch {
      res.status(404).end();
    }
  });

  app.get('/api/member-form', async (_req, res) => {
    const config = await readMemberFormConfig();
    res.json({ ok: true, config });
  });

  app.post('/api/member-form', async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp, Date.now())) {
      res.status(429).json({ ok: false, error: 'Too many requests. Please wait a moment.' });
      return;
    }

    const rawUrl = typeof req.body?.formUrl === 'string' ? req.body.formUrl : '';
    const formTitleRaw = typeof req.body?.formTitle === 'string' ? req.body.formTitle.trim() : '';
    let parsed = parseGoogleFormUrl(rawUrl);

    if (!parsed.valid) {
      res.status(400).json({
        ok: false,
        error: parsed.error || 'Please enter a valid Google Form link.',
      });
      return;
    }

    // Safely resolve forms.gle short links so the live embed URL uses docs.google.com/forms/...
    if (parsed.isShortLink) {
      try {
        const resolveRes = await fetch(parsed.viewUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(6_000),
        });
        const location = resolveRes.headers.get('location') || '';
        if (location) {
          const resolved = parseGoogleFormUrl(location);
          if (resolved.valid && !resolved.isShortLink) {
            parsed = resolved;
          }
        }
      } catch {
        // Keep short link as fallback viewUrl if resolution times out
      }
    }

    const config: MemberFormConfig = {
      viewUrl: parsed.viewUrl,
      embedUrl: parsed.embedUrl,
      formTitle:
        formTitleRaw.slice(0, 120) || "God's Palace Member Registration Form",
      updatedAt: new Date().toISOString(),
    };

    try {
      await writeMemberFormConfig(config);
      res.json({ ok: true, config });
    } catch (err) {
      console.error('Failed to save Google Form configuration:', err);
      res.status(500).json({ ok: false, error: 'Could not save the Google Form link right now.' });
    }
  });

  app.delete('/api/member-form', async (_req, res) => {
    try {
      await fs.unlink(MEMBER_FORM_CONFIG_FILE);
    } catch {
      // Ignore if already absent
    }
    res.json({ ok: true, config: getDefaultMemberFormConfig() });
  });

  // --- Church Giving & Bank Transfer Account Endpoints ---
  app.get('/api/giving-config', async (_req, res) => {
    const config = await readGivingConfig();
    res.json({ ok: true, config });
  });

  app.post('/api/givings', async (req, res) => {
    const nowMs = Date.now();
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp, nowMs)) {
      res.status(429).json({
        ok: false,
        error: 'Too many requests in a short time. Please wait a minute before trying again.',
      });
      return;
    }

    const validation = validateGivingSubmission(req.body);
    if (validation.isSpam) {
      res.status(400).json({ ok: false, error: 'Unable to process submission.' });
      return;
    }
    if (!validation.valid || !validation.sanitized) {
      res.status(400).json({
        ok: false,
        error: 'Please check the highlighted giving details and try again.',
        errors: validation.errors,
      });
      return;
    }

    const fingerprint = `give|${createGivingFingerprint(validation.sanitized)}`;
    if (isDuplicateSubmission(recentFingerprints, fingerprint, nowMs, 60_000)) {
      res.status(409).json({
        ok: false,
        error: 'We already logged this giving confirmation a moment ago. God bless you!',
      });
      return;
    }

    const id = `GP-GIVE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const submittedAt = new Date(nowMs).toISOString();
    const narration = buildTransferNarration(
      validation.sanitized.category,
      validation.sanitized.giverName,
      validation.sanitized.isAnonymous,
    );

    try {
      await persistGivingRecord({
        id,
        submittedAt,
        narration,
        payload: validation.sanitized,
      });
      recentFingerprints.set(fingerprint, nowMs);

      const emailResult = await dispatchChurchEmail(
        buildGivingEmailContent(id, submittedAt, narration, validation.sanitized),
      );

      res.status(201).json({
        ok: true,
        id,
        submittedAt,
        narration,
        emailDelivered: emailResult.delivered,
        notificationEmail: emailResult.recipient,
        message:
          'Thank you for your faithful giving! Our finance team has received your transfer notification.',
      });
    } catch (err) {
      console.error('Failed to record giving confirmation:', err);
      res.status(500).json({
        ok: false,
        error: 'We could not record your giving confirmation right now. Please try again or reach us on WhatsApp.',
      });
    }
  });

  // Single unified submission endpoint for Visitor, Prayer Request, and Contact forms.
  // Deliberately write-only (no public GET endpoint) so private prayer requests stay confidential.
  app.post('/api/submissions', async (req, res) => {
    const nowMs = Date.now();
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (isRateLimited(clientIp, nowMs)) {
      res.status(429).json({
        ok: false,
        error: 'Too many requests in a short time. Please wait a minute before trying again.',
      });
      return;
    }

    const validation = validateSubmission(req.body);
    if (validation.isSpam) {
      res.status(400).json({
        ok: false,
        error: 'Unable to process submission.',
      });
      return;
    }

    if (!validation.valid || !validation.sanitized) {
      res.status(400).json({
        ok: false,
        error: 'Please check the highlighted fields and try again.',
        errors: validation.errors,
      });
      return;
    }

    const fingerprint = createSubmissionFingerprint(validation.sanitized);
    if (isDuplicateSubmission(recentFingerprints, fingerprint, nowMs, 60_000)) {
      res.status(409).json({
        ok: false,
        error: 'We already received this submission a moment ago. Thank you!',
      });
      return;
    }

    const id = `GH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const submittedAt = new Date(nowMs).toISOString();

    try {
      await persistSubmission({
        id,
        submittedAt,
        payload: validation.sanitized,
      });
      recentFingerprints.set(fingerprint, nowMs);

      const emailResult = await dispatchChurchEmail(
        buildSubmissionEmailContent(id, submittedAt, validation.sanitized),
      );

      const confirmationMessage =
        validation.sanitized.type === 'prayer'
          ? 'Your prayer request has been received safely and routed according to your privacy preference.'
          : validation.sanitized.type === 'visitor'
            ? 'Thank you for planning a visit with us! Our welcome team looks forward to greeting you.'
            : 'Thank you for reaching out. Our church office will respond as soon as possible.';

      res.status(201).json({
        ok: true,
        id,
        submittedAt,
        emailDelivered: emailResult.delivered,
        notificationEmail: emailResult.recipient,
        message: confirmationMessage,
      });
    } catch (err) {
      console.error('Failed to save submission:', err);
      res.status(500).json({
        ok: false,
        error: 'We could not save your submission right now. Please try again or call the church office.',
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Church website running on http://localhost:${PORT}`);
    startAutomaticFacebookVideoSync();
  });
}

startServer();
