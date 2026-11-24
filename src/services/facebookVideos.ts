import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  buildFacebookVideoEmbedUrl,
  deduplicateAndNormalizeVideos,
  extractFacebookVideosFromHtml,
  filterGoodFacebookVideos,
  generateCleanVideoTitle,
  isSafeFacebookUrl,
  isSafeThumbnailUrl,
  normalizeFacebookText,
  parseFacebookVideoCard,
  rankFacebookVideos,
  type FacebookVideoItem,
  type RawFacebookCard,
  type VideoSortMode,
} from '../utils/facebookVideoLogic.ts';
import { applyAutomaticVideoTitles } from './videoAutoTitler.ts';

const execFileAsync = promisify(execFile);

export const FACEBOOK_PAGE_ID = '100080364799775';
export const FACEBOOK_PAGE_URL =
  'https://web.facebook.com/people/Gods-Palace-Evangelical-Ministry-Worldwide/100080364799775/';
export const FACEBOOK_VIDEOS_URL =
  'https://www.facebook.com/profile.php?id=100080364799775&sk=videos';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, 'facebook-videos-cache.json');
const THUMBS_DIR = path.join(DATA_DIR, 'video-thumbs');
const SYNC_SESSION = 'gpemww_vid_sync';
const CACHE_STALE_MS = 45_000;
const LISTENER_INTERVAL_MS = 45_000;

export interface VideoFeedSnapshot {
  videos: FacebookVideoItem[];
  lastSyncedAt: string;
  lastAttemptAt: string;
  syncSource: 'facebook-live' | 'facebook-graph' | 'cached';
  facebookPageUrl: string;
  facebookVideosUrl: string;
  newVideoIds?: string[];
  listenerIntervalSeconds?: number;
  aiError?: string;
}

export type VideoFeedListener = (snapshot: VideoFeedSnapshot) => void;
const feedListeners = new Set<VideoFeedListener>();

export function subscribeToFacebookVideoUpdates(listener: VideoFeedListener): () => void {
  feedListeners.add(listener);
  return () => {
    feedListeners.delete(listener);
  };
}

function notifyFeedListeners(snapshot: VideoFeedSnapshot): void {
  for (const listener of feedListeners) {
    try {
      listener(snapshot);
    } catch {
      // Ignore individual subscriber delivery errors
    }
  }
}

const VERIFIED_BASELINE_VIDEOS: FacebookVideoItem[] = [
  {
    id: '1507625324804658',
    title:
      "This is a Timely Purposeful Message Titled In the Journey of Life Don't go without a Purpose listen that Be Blessed.",
    url: 'https://www.facebook.com/100080364799775/videos/1507625324804658/',
    embedUrl: buildFacebookVideoEmbedUrl(
      'https://www.facebook.com/100080364799775/videos/1507625324804658/',
    ),
    thumbnailUrl: '/src/assets/images/gpemww_ministry_worship.jpg',
    durationText: '13:44',
    durationSeconds: 824,
    publishedText: '10 hours ago',
    publishedAtMs: Date.now() - 10 * 3600_000,
    relativeAgeMinutes: 600,
    viewsCount: 101,
    reactionsCount: 5,
    feedOrder: 0,
  },
  {
    id: '1419297407070155',
    title:
      'THIS MESSAGE WILL CERTAINLY INCREASE YOUR COURAGE IN THE JOURNEY OF LIFE. WHAT A POWERFUL MESSAGE TITLED IN THIS JOURNEY OF LIFE GO WITH COURAGE. STAY BLESS AS YOU LISTEN',
    url: 'https://www.facebook.com/100080364799775/videos/1419297407070155/',
    embedUrl: buildFacebookVideoEmbedUrl(
      'https://www.facebook.com/100080364799775/videos/1419297407070155/',
    ),
    thumbnailUrl: '/src/assets/images/gpemww_pastor_pulpit.jpg',
    durationText: '12:42',
    durationSeconds: 762,
    publishedText: 'a day ago',
    publishedAtMs: Date.now() - 24 * 3600_000,
    relativeAgeMinutes: 1440,
    viewsCount: 88,
    reactionsCount: 4,
    feedOrder: 1,
  },
  {
    id: '1626817355327228',
    title: 'GOD TALK TO ME',
    url: 'https://www.facebook.com/100080364799775/videos/1626817355327228/',
    embedUrl: buildFacebookVideoEmbedUrl(
      'https://www.facebook.com/100080364799775/videos/1626817355327228/',
    ),
    thumbnailUrl: '/src/assets/images/gpemww_hero_sanctuary_1795464580386.jpg',
    durationText: '4:56',
    durationSeconds: 296,
    publishedText: 'a day ago',
    publishedAtMs: Date.now() - 25 * 3600_000,
    relativeAgeMinutes: 1440,
    viewsCount: 90,
    reactionsCount: 14,
    feedOrder: 2,
  },
  {
    id: '1448918506760884',
    title: 'Divine Favour as Shield.... What a Powerful message. Listen and be Blessed.',
    url: 'https://www.facebook.com/100080364799775/videos/1448918506760884/',
    embedUrl: buildFacebookVideoEmbedUrl(
      'https://www.facebook.com/100080364799775/videos/1448918506760884/',
    ),
    thumbnailUrl: '/src/assets/images/gpemww_pastor_pulpit.jpg',
    durationText: '6:34',
    durationSeconds: 394,
    publishedText: '6 days ago',
    publishedAtMs: Date.now() - 6 * 86400_000,
    relativeAgeMinutes: 8640,
    viewsCount: 142,
    reactionsCount: 5,
    feedOrder: 3,
  },
  {
    id: '1163942933300568',
    title: 'The Hour is now ... Jesus Glorify your Name.',
    url: 'https://www.facebook.com/100080364799775/videos/1163942933300568/',
    embedUrl: buildFacebookVideoEmbedUrl(
      'https://www.facebook.com/100080364799775/videos/1163942933300568/',
    ),
    thumbnailUrl: '/src/assets/images/gpemww_choir_band_1795464579662.jpg',
    durationText: '2:14',
    durationSeconds: 134,
    publishedText: 'a week ago',
    publishedAtMs: Date.now() - 7 * 86400_000,
    relativeAgeMinutes: 10080,
    viewsCount: 181,
    reactionsCount: 10,
    feedOrder: 4,
  },
  {
    id: '4536033416648810',
    title:
      "Enter His Gates with Praises... It was awesome with our Father Rev. Dr. Omorogieva Agbonmwanre Anthony Praising God God's Palace Evangelical Ministry Worldwide",
    url: 'https://www.facebook.com/100080364799775/videos/4536033416648810/',
    embedUrl: buildFacebookVideoEmbedUrl(
      'https://www.facebook.com/100080364799775/videos/4536033416648810/',
    ),
    thumbnailUrl: '/src/assets/images/gpemww_choir_band_1795464579662.jpg',
    durationText: '4:45',
    durationSeconds: 285,
    publishedText: 'a week ago',
    publishedAtMs: Date.now() - 8 * 86400_000,
    relativeAgeMinutes: 10080,
    viewsCount: 185,
    reactionsCount: 13,
    feedOrder: 5,
  },
  {
    id: '996191176261041',
    title: 'Pray Along with Rev Dr Omorogieva Agbonmwanre Anthony',
    url: 'https://www.facebook.com/100080364799775/videos/996191176261041/',
    embedUrl: buildFacebookVideoEmbedUrl(
      'https://www.facebook.com/100080364799775/videos/996191176261041/',
    ),
    thumbnailUrl: '/src/assets/images/gpemww_pastor_pulpit.jpg',
    durationText: '4:27',
    durationSeconds: 267,
    publishedText: 'a week ago',
    publishedAtMs: Date.now() - 9 * 86400_000,
    relativeAgeMinutes: 10080,
    viewsCount: 290,
    reactionsCount: 18,
    feedOrder: 6,
  },
  {
    id: '2214793432404679',
    title:
      "All of us at God's Palace Evangelical Ministry Worldwide Welcome our Father to Akwa Ibom",
    url: 'https://www.facebook.com/100080364799775/videos/2214793432404679/',
    embedUrl: buildFacebookVideoEmbedUrl(
      'https://www.facebook.com/100080364799775/videos/2214793432404679/',
    ),
    thumbnailUrl: '/src/assets/images/gpemww_fellowship_courtyard_1795464595819.jpg',
    durationText: '0:45',
    durationSeconds: 45,
    publishedText: 'a week ago',
    publishedAtMs: Date.now() - 10 * 86400_000,
    relativeAgeMinutes: 10080,
    viewsCount: 243,
    reactionsCount: 13,
    feedOrder: 7,
  },
];

let inFlightSync: Promise<VideoFeedSnapshot> | null = null;
let memorySnapshot: VideoFeedSnapshot | null = null;

export function getSafeThumbFilePath(videoId: string): string | null {
  if (!/^\d{6,30}$/.test(videoId)) return null;
  const resolved = path.resolve(THUMBS_DIR, `${videoId}.jpg`);
  if (!resolved.startsWith(THUMBS_DIR + path.sep)) return null;
  return resolved;
}

async function cacheThumbnailLocally(videoId: string, remoteUrl: string): Promise<string | null> {
  const targetPath = getSafeThumbFilePath(videoId);
  if (!targetPath) return null;

  try {
    const stat = await fs.stat(targetPath);
    if (stat.size >= 512) {
      return `/api/video-thumbs/${videoId}`;
    }
  } catch {
    // Not cached locally yet
  }

  if (!isSafeThumbnailUrl(remoteUrl)) return null;

  try {
    await fs.mkdir(THUMBS_DIR, { recursive: true });
    const response = await fetch(remoteUrl, {
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: 'image/*',
      },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 512 || buffer.length > 5_000_000) return null;

    await fs.writeFile(targetPath, buffer);
    return `/api/video-thumbs/${videoId}`;
  } catch {
    return null;
  }
}

async function readDiskCache(): Promise<VideoFeedSnapshot | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as VideoFeedSnapshot;
    if (parsed && Array.isArray(parsed.videos) && parsed.videos.length > 0) {
      return parsed;
    }
  } catch {
    // No cache yet
  }
  return null;
}

async function writeDiskCache(snapshot: VideoFeedSnapshot): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
}

function formatDurationFromSeconds(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function syncViaGraphApi(token: string): Promise<FacebookVideoItem[] | null> {
  try {
    const url = new URL(`https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/videos`);
    url.searchParams.set(
      'fields',
      'id,title,description,created_time,length,permalink_url,picture,views',
    );
    url.searchParams.set('limit', '20');

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      data?: Array<{
        id: string;
        title?: string;
        description?: string;
        created_time?: string;
        length?: number;
        permalink_url?: string;
        picture?: string;
        views?: number;
      }>;
    };

    if (!Array.isArray(json.data) || json.data.length === 0) return null;

    const nowMs = Date.now();
    const mapped: FacebookVideoItem[] = [];
    for (let idx = 0; idx < json.data.length; idx++) {
      const row = json.data[idx];
      const videoUrl = row.permalink_url
        ? row.permalink_url.startsWith('http')
          ? row.permalink_url
          : `https://www.facebook.com${row.permalink_url}`
        : `https://www.facebook.com/${FACEBOOK_PAGE_ID}/videos/${row.id}/`;

      if (!isSafeFacebookUrl(videoUrl) || !/^\d{6,30}$/.test(row.id)) continue;

      const createdAtMs = row.created_time ? Date.parse(row.created_time) : nowMs - idx * 86_400_000;
      const ageMinutes = Math.max(0, Math.round((nowMs - createdAtMs) / 60_000));
      const lengthSec = typeof row.length === 'number' ? Math.round(row.length) : 0;
      const localThumb = row.picture ? await cacheThumbnailLocally(row.id, row.picture) : null;

      mapped.push({
        id: row.id,
        title:
          normalizeFacebookText(row.title || row.description || '') ||
          "God's Palace Evangelical Ministry Worldwide Video",
        url: videoUrl,
        embedUrl: buildFacebookVideoEmbedUrl(videoUrl),
        thumbnailUrl: localThumb || '/src/assets/images/gpemww_ministry_worship.jpg',
        durationText: lengthSec > 0 ? formatDurationFromSeconds(lengthSec) : 'Video',
        durationSeconds: lengthSec,
        publishedText: row.created_time
          ? new Date(createdAtMs).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recent Facebook Video',
        publishedAtMs: createdAtMs,
        relativeAgeMinutes: ageMinutes,
        viewsCount: typeof row.views === 'number' ? row.views : 0,
        reactionsCount: 0,
        feedOrder: idx,
      });
    }

    return mapped.length > 0 ? mapped : null;
  } catch {
    return null;
  }
}

function parsePlaywrightCliResult(stdout: string): RawFacebookCard[] {
  const marker = '### Result';
  const markerIndex = stdout.indexOf(marker);
  if (markerIndex === -1) return [];
  const after = stdout.slice(markerIndex + marker.length).trim();
  const firstLine = after.split(/\r?\n/).find((line) => line.trim().startsWith('"') || line.trim().startsWith('['));
  if (!firstLine) return [];

  try {
    const firstParse = JSON.parse(firstLine.trim());
    const data = typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function syncViaPlaywrightCli(): Promise<FacebookVideoItem[] | null> {
  const extractScript = `async (page) => {
    await page.waitForTimeout(3200);
    const closeBtn = page.locator('[aria-label="Close"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click().catch(() => {});
      await page.waitForTimeout(600);
    }
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1200);
    const cards = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]')).filter(a => /\\/reel\\/|\\/videos\\//.test(a.href));
      const seen = new Set();
      const out = [];
      for (const a of anchors) {
        const cleanUrl = a.href.split('?')[0];
        if (seen.has(cleanUrl)) continue;
        let box = a;
        for (let i = 0; i < 4 && box.parentElement; i++) {
          if (box.parentElement.querySelector('img') && (box.parentElement.innerText || '').length > 10) {
            box = box.parentElement;
            break;
          }
          box = box.parentElement;
        }
        const img = box.querySelector('img');
        const text = (box.innerText || a.innerText || '').trim();
        if (text || img) {
          seen.add(cleanUrl);
          out.push({ url: cleanUrl, text, img: img ? img.src : null });
        }
      }
      return out.slice(0, 18);
    });
    return JSON.stringify(cards);
  }`;

  try {
    await execFileAsync('playwright-cli', [`-s=${SYNC_SESSION}`, 'open', FACEBOOK_VIDEOS_URL], {
      timeout: 25_000,
    });
    const { stdout } = await execFileAsync(
      'playwright-cli',
      [`-s=${SYNC_SESSION}`, 'run-code', extractScript],
      { timeout: 25_000, maxBuffer: 2 * 1024 * 1024 },
    );

    const rawCards = parsePlaywrightCliResult(stdout);
    if (rawCards.length === 0) return null;

    const nowMs = Date.now();
    const parsedItems: FacebookVideoItem[] = [];
    for (let i = 0; i < rawCards.length; i++) {
      const parsed = parseFacebookVideoCard(rawCards[i], i, nowMs);
      if (parsed) parsedItems.push(parsed);
    }

    const deduped = deduplicateAndNormalizeVideos(parsedItems);
    if (deduped.length === 0) return null;

    // Cache thumbnails locally so images never expire on external CDN URLs
    await Promise.all(
      deduped.map(async (video) => {
        if (video.thumbnailUrl) {
          const localUrl = await cacheThumbnailLocally(video.id, video.thumbnailUrl);
          if (localUrl) {
            video.thumbnailUrl = localUrl;
          } else {
            video.thumbnailUrl = '/src/assets/images/gpemww_ministry_worship.jpg';
          }
        } else {
          video.thumbnailUrl = '/src/assets/images/gpemww_ministry_worship.jpg';
        }
      }),
    );

    return deduped;
  } catch {
    return null;
  } finally {
    await execFileAsync('playwright-cli', [`-s=${SYNC_SESSION}`, 'close'], {
      timeout: 10_000,
    }).catch(() => {});
  }
}

async function syncViaPublicHttpFetch(): Promise<FacebookVideoItem[] | null> {
  try {
    const response = await fetch(FACEBOOK_VIDEOS_URL, {
      signal: AbortSignal.timeout(12_000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const extracted = extractFacebookVideosFromHtml(html, FACEBOOK_PAGE_ID, Date.now());
    if (extracted.length === 0) return null;

    await Promise.all(
      extracted.map(async (video) => {
        if (video.thumbnailUrl) {
          const localUrl = await cacheThumbnailLocally(video.id, video.thumbnailUrl);
          video.thumbnailUrl = localUrl || '/src/assets/images/gpemww_ministry_worship.jpg';
        } else {
          video.thumbnailUrl = '/src/assets/images/gpemww_ministry_worship.jpg';
        }
      }),
    );

    return extracted;
  } catch {
    return null;
  }
}

async function finalizeSnapshot(
  rawVideos: FacebookVideoItem[],
  syncSource: 'facebook-live' | 'facebook-graph',
  attemptIso: string,
): Promise<VideoFeedSnapshot> {
  const screened = filterGoodFacebookVideos(rawVideos);
  const { videos: titledVideos, aiError } = await applyAutomaticVideoTitles(
    screened.length > 0 ? screened : rawVideos,
    getSafeThumbFilePath,
  );

  const previous = memorySnapshot ?? (await readDiskCache());
  const prevIds = new Set((previous?.videos || []).map((v) => v.id));
  const newVideoIds =
    previous && previous.videos.length > 0
      ? titledVideos.filter((v) => !prevIds.has(v.id)).map((v) => v.id)
      : [];

  const snapshot: VideoFeedSnapshot = {
    videos: titledVideos,
    lastSyncedAt: attemptIso,
    lastAttemptAt: attemptIso,
    syncSource,
    facebookPageUrl: FACEBOOK_PAGE_URL,
    facebookVideosUrl: FACEBOOK_VIDEOS_URL,
    newVideoIds,
    listenerIntervalSeconds: Math.round(LISTENER_INTERVAL_MS / 1000),
    ...(aiError ? { aiError } : {}),
  };

  const hasChanged =
    newVideoIds.length > 0 ||
    !previous ||
    previous.videos.length !== titledVideos.length ||
    previous.videos[0]?.id !== titledVideos[0]?.id ||
    previous.videos[0]?.title !== titledVideos[0]?.title ||
    previous.videos[0]?.viewsCount !== titledVideos[0]?.viewsCount;

  memorySnapshot = snapshot;
  await writeDiskCache(snapshot);

  if (hasChanged) {
    notifyFeedListeners(snapshot);
  }

  return snapshot;
}

export async function syncFacebookVideosNow(): Promise<VideoFeedSnapshot> {
  if (inFlightSync) {
    return inFlightSync;
  }

  inFlightSync = (async () => {
    const attemptIso = new Date().toISOString();
    const graphToken = (process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim();

    if (graphToken) {
      const graphVideos = await syncViaGraphApi(graphToken);
      if (graphVideos && graphVideos.length > 0) {
        return finalizeSnapshot(graphVideos, 'facebook-graph', attemptIso);
      }
    }

    // Zero-secret continuous public Facebook page check (works in standard Node/Cloud Run without Playwright or tokens)
    const httpVideos = await syncViaPublicHttpFetch();
    if (httpVideos && httpVideos.length > 0) {
      return finalizeSnapshot(httpVideos, 'facebook-live', attemptIso);
    }

    // Secondary fallback: headless browser sync when available
    const liveVideos = await syncViaPlaywrightCli();
    if (liveVideos && liveVideos.length > 0) {
      return finalizeSnapshot(liveVideos, 'facebook-live', attemptIso);
    }

    const existing = memorySnapshot ?? (await readDiskCache());
    if (existing) {
      const updated: VideoFeedSnapshot = {
        ...existing,
        lastAttemptAt: attemptIso,
        syncSource: 'cached',
        listenerIntervalSeconds: Math.round(LISTENER_INTERVAL_MS / 1000),
      };
      memorySnapshot = updated;
      return updated;
    }

    const cleanedBaseline = VERIFIED_BASELINE_VIDEOS.map((v) => ({
      ...v,
      originalTitle: v.originalTitle || v.title,
      title: generateCleanVideoTitle(v.title, v.durationSeconds),
      titleSource: 'auto' as const,
    }));

    const fallback: VideoFeedSnapshot = {
      videos: cleanedBaseline,
      lastSyncedAt: attemptIso,
      lastAttemptAt: attemptIso,
      syncSource: 'cached',
      facebookPageUrl: FACEBOOK_PAGE_URL,
      facebookVideosUrl: FACEBOOK_VIDEOS_URL,
      listenerIntervalSeconds: Math.round(LISTENER_INTERVAL_MS / 1000),
    };
    memorySnapshot = fallback;
    return fallback;
  })();

  try {
    return await inFlightSync;
  } finally {
    inFlightSync = null;
  }
}

export async function getRankedFacebookVideos(sortMode: VideoSortMode = 'latest'): Promise<{
  videos: FacebookVideoItem[];
  lastSyncedAt: string;
  syncSource: 'facebook-live' | 'facebook-graph' | 'cached';
  isSyncing: boolean;
  facebookPageUrl: string;
  facebookVideosUrl: string;
  listenerIntervalSeconds: number;
  aiError?: string;
}> {
  if (!memorySnapshot) {
    const fromDisk = await readDiskCache();
    if (fromDisk) {
      memorySnapshot = {
        ...fromDisk,
        videos: fromDisk.videos.map((v) => ({
          ...v,
          originalTitle: v.originalTitle || v.title,
          title:
            v.titleSource === 'ai'
              ? v.title
              : generateCleanVideoTitle(v.originalTitle || v.title, v.durationSeconds),
          titleSource: v.titleSource || 'auto',
        })),
      };
    } else {
      memorySnapshot = {
        videos: VERIFIED_BASELINE_VIDEOS.map((v) => ({
          ...v,
          originalTitle: v.originalTitle || v.title,
          title: generateCleanVideoTitle(v.title, v.durationSeconds),
          titleSource: 'auto' as const,
        })),
        lastSyncedAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString(),
        syncSource: 'cached',
        facebookPageUrl: FACEBOOK_PAGE_URL,
        facebookVideosUrl: FACEBOOK_VIDEOS_URL,
        listenerIntervalSeconds: Math.round(LISTENER_INTERVAL_MS / 1000),
      };
    }
  }

  const lastAttemptMs = Date.parse(memorySnapshot.lastAttemptAt) || 0;
  if (Date.now() - lastAttemptMs > CACHE_STALE_MS && !inFlightSync) {
    void syncFacebookVideosNow().catch(() => {});
  }

  return {
    videos: rankFacebookVideos(memorySnapshot.videos, sortMode),
    lastSyncedAt: memorySnapshot.lastSyncedAt,
    syncSource: memorySnapshot.syncSource,
    isSyncing: Boolean(inFlightSync),
    facebookPageUrl: memorySnapshot.facebookPageUrl,
    facebookVideosUrl: memorySnapshot.facebookVideosUrl,
    listenerIntervalSeconds: memorySnapshot.listenerIntervalSeconds ?? 45,
    ...(memorySnapshot.aiError ? { aiError: memorySnapshot.aiError } : {}),
  };
}

export function startAutomaticFacebookVideoSync(): void {
  // Listen immediately after boot
  setTimeout(() => {
    void syncFacebookVideosNow().catch(() => {});
  }, 1_500).unref();

  // Continuously listen every 45 seconds for newly posted Facebook videos
  setInterval(() => {
    void syncFacebookVideosNow().catch(() => {});
  }, LISTENER_INTERVAL_MS).unref();
}
