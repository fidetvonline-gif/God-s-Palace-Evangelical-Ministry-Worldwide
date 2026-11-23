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

interface StoredSubmission {
  id: string;
  submittedAt: string;
  payload: SubmissionPayload;
}

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

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
  });
}

startServer();
