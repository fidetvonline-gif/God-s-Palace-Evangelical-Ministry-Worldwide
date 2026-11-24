export type VideoSortMode = 'latest' | 'popular' | 'duration';

export interface FacebookVideoItem {
  id: string;
  title: string;
  originalTitle?: string;
  titleSource?: 'auto' | 'ai';
  url: string;
  embedUrl: string;
  thumbnailUrl: string;
  durationText: string;
  durationSeconds: number;
  publishedText: string;
  publishedAtMs: number;
  relativeAgeMinutes: number;
  viewsCount: number;
  reactionsCount: number;
  feedOrder: number;
}

const ALLOWED_FACEBOOK_HOSTS = new Set([
  'www.facebook.com',
  'web.facebook.com',
  'm.facebook.com',
  'facebook.com',
  'fb.watch',
]);

const ALLOWED_THUMB_SUFFIXES = ['.fbcdn.net', '.fbsbx.com'];

/**
 * Normalizes stylized Unicode mathematical bold/italic characters often used in Facebook posts
 * into standard readable text while preserving normal punctuation.
 */
export function normalizeFacebookText(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSafeFacebookUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && ALLOWED_FACEBOOK_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function isSafeThumbnailUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_THUMB_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

export function extractFacebookVideoId(rawUrl: string): string | null {
  const match = rawUrl.match(/\/(?:videos|reel)(?:\/[^/]+)?\/(\d{6,30})/);
  if (match) return match[1];
  const watchMatch = rawUrl.match(/[?&]v=(\d{6,30})/);
  return watchMatch ? watchMatch[1] : null;
}

export function buildFacebookVideoEmbedUrl(videoUrl: string): string {
  if (!isSafeFacebookUrl(videoUrl)) return '';
  const clean = videoUrl.split('?')[0];
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(clean)}&show_text=false`;
}

export function parseDurationToSeconds(durationText: string): number {
  const match = durationText.trim().match(/^(\d{1,2}:)?(\d{1,2}):(\d{2})$/);
  if (!match) return 0;
  const hours = match[1] ? Number.parseInt(match[1].replace(':', ''), 10) : 0;
  const minutes = Number.parseInt(match[2], 10);
  const seconds = Number.parseInt(match[3], 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseMetricCount(text: string): number {
  const match = text.match(/([\d.,]+)\s*([KMB])?/i);
  if (!match) return 0;
  const base = Number.parseFloat(match[1].replace(/,/g, ''));
  if (!Number.isFinite(base)) return 0;
  const unit = (match[2] || '').toUpperCase();
  if (unit === 'K') return Math.round(base * 1_000);
  if (unit === 'M') return Math.round(base * 1_000_000);
  if (unit === 'B') return Math.round(base * 1_000_000_000);
  return Math.round(base);
}

export function parseRelativeAgeMinutes(publishedText: string): number {
  const clean = publishedText.toLowerCase().trim();
  if (!clean) return Number.MAX_SAFE_INTEGER;
  if (clean.includes('just now') || clean.includes('live')) return 0;

  const numWord = (token: string): number => {
    if (token === 'a' || token === 'an') return 1;
    const n = Number.parseInt(token, 10);
    return Number.isFinite(n) ? n : 1;
  };

  const match = clean.match(/^(\d+|an?)\s+(min(?:ute)?|hr|hour|day|week|month|year)s?\s+ago/);
  if (!match) return 999_999;

  const qty = numWord(match[1]);
  const unit = match[2];
  if (unit.startsWith('min')) return qty;
  if (unit === 'hr' || unit === 'hour') return qty * 60;
  if (unit === 'day') return qty * 1_440;
  if (unit === 'week') return qty * 10_080;
  if (unit === 'month') return qty * 43_200;
  if (unit === 'year') return qty * 525_600;
  return 999_999;
}

export interface RawFacebookCard {
  url: string;
  text: string;
  img?: string | null;
}

const SMALL_TITLE_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

function toSmartMinistryTitleCase(text: string): string {
  const words = text.trim().split(/\s+/);
  return words
    .map((word, index) => {
      if (!word) return word;
      if (/^(GPEMWW|G\.O\.|G\.O|REV\.?|DR\.?)$/i.test(word)) {
        if (/^gpemww$/i.test(word)) return 'GPEMWW';
        if (/^g\.o\.?$/i.test(word)) return 'G.O.';
        if (/^rev\.?$/i.test(word)) return 'Rev.';
        if (/^dr\.?$/i.test(word)) return 'Dr.';
      }
      const lower = word.toLowerCase();
      if (index > 0 && index < words.length - 1 && SMALL_TITLE_WORDS.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function formatContextualUntitledVideo(durationSeconds: number): string {
  if (durationSeconds > 0 && durationSeconds <= 90) {
    return "Sanctuary Praise & Ministry Highlight — God's Palace";
  }
  if (durationSeconds > 90 && durationSeconds <= 360) {
    return "Short Word & Prayer Charge — God's Palace Ministry";
  }
  if (durationSeconds > 360) {
    return "Sunday Word & Ministration — God's Palace Worldwide";
  }
  return "Ministry Broadcast — God's Palace Worldwide";
}

export function generateCleanVideoTitle(
  rawCaption: string,
  durationSeconds = 0,
): string {
  const normalized = normalizeFacebookText(rawCaption);
  if (
    !normalized ||
    /^god'?s palace evangelical ministry worldwide'?s video$/i.test(normalized) ||
    /^video$/i.test(normalized) ||
    /^untitled/i.test(normalized)
  ) {
    return formatContextualUntitledVideo(durationSeconds);
  }

  let candidate = normalized;

  // Extract explicit sermon title after phrases like "Message Titled ..."
  const titledMatch = candidate.match(
    /(?:message|sermon|word)\s+titled[:\s-]+(.+?)(?:(?:don'?t|listen|stay|be blessed|what a|$))/i,
  );
  if (titledMatch && titledMatch[1] && titledMatch[1].trim().length >= 5) {
    const afterTitled = candidate.slice(candidate.toLowerCase().indexOf('titled') + 6).trim();
    candidate = afterTitled.replace(/^[:\-\s]+/, '');
  }

  // Remove common trailing Facebook social sign-offs, merged post paragraphs, and courtesy footers
  candidate = candidate
    .replace(/\*?\s*courtesy\s*:.*$/i, '')
    .replace(/see you in church\.*/gi, '')
    .replace(/(?:We are grateful to announce|Praising God).*$/i, '')
    .replace(/[.\s]*(?:listen(?:\s+that|\s+and)?|stay\s+bless(?:ed)?\s+as\s+you\s+listen).*$/i, '')
    .replace(/what a powerful message\.?/gi, '')
    .replace(/it was awesome with our father/gi, 'Worship With Our Father')
    .replace(/god'?s palace evangelical ministry worldwide$/i, '')
    .replace(/\.{2,}/g, ' — ')
    .replace(/\s*[—\-:|]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (candidate.length < 4) {
    candidate = normalized;
  }

  // Convert noisy ALL-CAPS captions into readable title case
  const lettersOnly = candidate.replace(/[^a-zA-Z]/g, '');
  const upperCount = (candidate.match(/[A-Z]/g) || []).length;
  const isMostlyUpper = lettersOnly.length >= 6 && upperCount / lettersOnly.length > 0.72;
  if (isMostlyUpper) {
    candidate = toSmartMinistryTitleCase(candidate);
  } else {
    candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1);
  }

  // Trim cleanly at word boundary if very long
  if (candidate.length > 96) {
    const firstSentence = candidate.split(/(?<=[.!?])\s+/)[0];
    if (firstSentence && firstSentence.length >= 16 && firstSentence.length <= 96) {
      candidate = firstSentence.replace(/[.]+$/, '');
    } else {
      const sliced = candidate.slice(0, 92);
      const lastSpace = sliced.lastIndexOf(' ');
      candidate = `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim()}`;
    }
  }

  return candidate.replace(/\s+(?:Rev|Dr|We)$/i, '').replace(/\s+/g, ' ').trim();
}

export function filterGoodFacebookVideos(
  videos: FacebookVideoItem[],
): FacebookVideoItem[] {
  return videos.filter((video) => {
    if (!video || !/^\d{6,30}$/.test(video.id)) return false;
    if (!isSafeFacebookUrl(video.url)) return false;
    // Reject explicitly broken/empty zero-length stubs without views or thumbnail
    const hasVisualOrEngagement =
      Boolean(video.thumbnailUrl) || video.viewsCount > 0 || video.durationSeconds > 0;
    if (!hasVisualOrEngagement) return false;
    if (/\b(test\s*clip|deleted\s*video)\b/i.test(video.originalTitle || video.title)) {
      return false;
    }
    return true;
  });
}

export function parseFacebookVideoCard(
  raw: RawFacebookCard,
  feedOrder: number,
  nowMs: number,
): FacebookVideoItem | null {
  const cleanUrl = raw.url.split('?')[0];
  if (!isSafeFacebookUrl(cleanUrl)) return null;

  const id = extractFacebookVideoId(cleanUrl);
  if (!id) return null;

  const lines = raw.text
    .split(/\r?\n/)
    .map((line) => normalizeFacebookText(line))
    .filter((line) => line.length > 0 && line !== '·');

  let durationText = '';
  let publishedText = '';
  let viewsCount = 0;
  let reactionsCount = 0;
  const titleLines: string[] = [];

  for (const line of lines) {
    // Skip active player scrub time like "0:00 / 4:55" and take the total duration
    const scrubMatch = line.match(/^\d{1,2}:\d{2}\s*\/\s*(\d{1,2}:?\d{1,2}:\d{2})$/);
    if (scrubMatch) {
      durationText = scrubMatch[1];
      continue;
    }
    if (!durationText && /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(line)) {
      durationText = line;
      continue;
    }
    if (/^(just now|\d+\s*(mins?|minutes?|hrs?|hours?|days?|weeks?|months?|years?)\s+ago|an?\s+(hour|day|week|month|year)\s+ago)$/i.test(line)) {
      publishedText = line;
      continue;
    }
    if (/[\d.,]+\s*[KMB]?\s+views?$/i.test(line)) {
      viewsCount = parseMetricCount(line);
      continue;
    }
    if (/^\d[\d.,]*[KMB]?$/i.test(line) && publishedText) {
      reactionsCount = parseMetricCount(line);
      continue;
    }
    titleLines.push(line);
  }

  const rawTitle = titleLines.join(' ').trim();
  const durationSeconds = parseDurationToSeconds(durationText);
  const title = generateCleanVideoTitle(rawTitle, durationSeconds);

  const relativeAgeMinutes = parseRelativeAgeMinutes(publishedText);
  const publishedAtMs =
    relativeAgeMinutes < 999_999
      ? nowMs - relativeAgeMinutes * 60_000
      : nowMs - (feedOrder + 1) * 86_400_000;

  return {
    id,
    title,
    originalTitle: rawTitle || undefined,
    titleSource: 'auto',
    url: cleanUrl,
    embedUrl: buildFacebookVideoEmbedUrl(cleanUrl),
    thumbnailUrl: raw.img && isSafeThumbnailUrl(raw.img) ? raw.img : '',
    durationText: durationText || 'Video',
    durationSeconds,
    publishedText: publishedText || 'Recent Facebook Video',
    publishedAtMs,
    relativeAgeMinutes,
    viewsCount,
    reactionsCount,
    feedOrder,
  };
}

export function deduplicateAndNormalizeVideos(
  items: FacebookVideoItem[],
): FacebookVideoItem[] {
  const byId = new Map<string, FacebookVideoItem>();
  for (const item of items) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }
    // Prefer the card entry with richer metadata (e.g., publishedText & viewsCount from the chronological grid)
    const existingScore =
      (existing.publishedText !== 'Recent Facebook Video' ? 2 : 0) +
      (existing.viewsCount > 0 ? 2 : 0) +
      (existing.title.length > 12 ? 1 : 0);
    const nextScore =
      (item.publishedText !== 'Recent Facebook Video' ? 2 : 0) +
      (item.viewsCount > 0 ? 2 : 0) +
      (item.title.length > 12 ? 1 : 0);

    if (nextScore > existingScore) {
      byId.set(item.id, {
        ...item,
        viewsCount: Math.max(item.viewsCount, existing.viewsCount),
        reactionsCount: Math.max(item.reactionsCount, existing.reactionsCount),
      });
    } else {
      byId.set(item.id, {
        ...existing,
        viewsCount: Math.max(item.viewsCount, existing.viewsCount),
        reactionsCount: Math.max(item.reactionsCount, existing.reactionsCount),
      });
    }
  }
  return [...byId.values()];
}

export function rankFacebookVideos(
  videos: FacebookVideoItem[],
  sortMode: VideoSortMode = 'latest',
): FacebookVideoItem[] {
  const list = [...videos];
  if (sortMode === 'popular') {
    return list.sort((a, b) => {
      if (b.viewsCount !== a.viewsCount) return b.viewsCount - a.viewsCount;
      if (b.reactionsCount !== a.reactionsCount) return b.reactionsCount - a.reactionsCount;
      return a.relativeAgeMinutes - b.relativeAgeMinutes;
    });
  }
  if (sortMode === 'duration') {
    return list.sort((a, b) => {
      if (b.durationSeconds !== a.durationSeconds) return b.durationSeconds - a.durationSeconds;
      return a.relativeAgeMinutes - b.relativeAgeMinutes;
    });
  }
  // Default: 'latest' — newest posted on Facebook ranks #1 automatically
  return list.sort((a, b) => {
    if (a.relativeAgeMinutes !== b.relativeAgeMinutes) {
      return a.relativeAgeMinutes - b.relativeAgeMinutes;
    }
    if (b.publishedAtMs !== a.publishedAtMs) {
      return b.publishedAtMs - a.publishedAtMs;
    }
    return a.feedOrder - b.feedOrder;
  });
}

export function formatDurationSeconds(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds));
  if (sec <= 0) return 'Video';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatRelativeAgeLabel(ageMinutes: number, publishedAtMs: number): string {
  if (ageMinutes < 2) return 'Just now';
  if (ageMinutes < 60) return `${ageMinutes} mins ago`;
  const hours = Math.round(ageMinutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'a day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks === 1) return 'a week ago';
  if (weeks <= 4) return `${weeks} weeks ago`;
  return new Date(publishedAtMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function extractBalancedJsonObject(source: string, keyMarker: string): unknown | null {
  const idx = source.indexOf(keyMarker);
  if (idx === -1) return null;
  const start = source.indexOf('{', idx);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end === -1) return null;
  try {
    return JSON.parse(source.slice(start, end));
  } catch {
    return null;
  }
}

interface RawGraphRelayVideoNode {
  id?: string;
  publish_time?: number;
  play_count?: number;
  canonical_uri_with_fallback?: string;
  image?: { uri?: string };
  savable_title?: { text?: string };
  video_thumbnail_overlays_renderer?: {
    video?: { playable_duration?: number };
  };
  creation_story?: {
    message?: { text?: string };
    attachments?: Array<{
      target?: {
        video_title?: { text?: string };
        preferred_thumbnail?: { image?: { uri?: string } };
      };
    }>;
  };
  feedback?: {
    reaction_count?: { count?: number };
  };
}

interface RawGraphRelayEdge {
  node?: RawGraphRelayVideoNode & {
    channel_tab_thumbnail_renderer?: {
      video?: RawGraphRelayVideoNode;
    };
  };
}

export function extractFacebookVideosFromHtml(
  html: string,
  pageId: string,
  nowMs: number,
): FacebookVideoItem[] {
  const items: FacebookVideoItem[] = [];
  let maxLatestAgeMinutes = 10_080; // at least 1 week fallback floor for older edges

  for (const collectionKey of ['latest_videos', 'all_videos']) {
    const parsed = extractBalancedJsonObject(html, `"${collectionKey}":{"edges":`) as {
      edges?: RawGraphRelayEdge[];
    } | null;

    const edges = Array.isArray(parsed?.edges) ? parsed.edges : [];
    for (let idx = 0; idx < edges.length; idx++) {
      const rawNode = edges[idx]?.node;
      const node = rawNode?.channel_tab_thumbnail_renderer?.video ?? rawNode;
      if (!node || typeof node.id !== 'string' || !/^\d{6,30}$/.test(node.id)) continue;

      const rawPermalink =
        typeof node.canonical_uri_with_fallback === 'string' &&
        isSafeFacebookUrl(node.canonical_uri_with_fallback)
          ? node.canonical_uri_with_fallback.split('?')[0]
          : `https://www.facebook.com/${pageId}/videos/${node.id}/`;

      const durationSec = Math.round(
        node.video_thumbnail_overlays_renderer?.video?.playable_duration ?? 0,
      );

      const rawCaption =
        node.savable_title?.text ||
        node.creation_story?.message?.text ||
        node.creation_story?.attachments?.[0]?.target?.video_title?.text ||
        '';
      const originalTitle = normalizeFacebookText(rawCaption);
      const title = generateCleanVideoTitle(originalTitle, durationSec);

      const hasPublishTime = typeof node.publish_time === 'number' && node.publish_time > 0;
      const publishedAtMs = hasPublishTime
        ? node.publish_time! * 1000
        : nowMs - (maxLatestAgeMinutes + (idx + 1) * 1440) * 60_000;
      const relativeAgeMinutes = hasPublishTime
        ? Math.max(0, Math.round((nowMs - publishedAtMs) / 60_000))
        : maxLatestAgeMinutes + (idx + 1) * 1440;

      if (hasPublishTime) {
        maxLatestAgeMinutes = Math.max(maxLatestAgeMinutes, relativeAgeMinutes);
      }

      const rawImg =
        node.image?.uri ||
        node.creation_story?.attachments?.[0]?.target?.preferred_thumbnail?.image?.uri ||
        '';

      items.push({
        id: node.id,
        title,
        originalTitle: originalTitle || undefined,
        titleSource: 'auto',
        url: rawPermalink,
        embedUrl: buildFacebookVideoEmbedUrl(rawPermalink),
        thumbnailUrl: isSafeThumbnailUrl(rawImg) ? rawImg : '',
        durationText: formatDurationSeconds(durationSec),
        durationSeconds: durationSec,
        publishedText: hasPublishTime
          ? formatRelativeAgeLabel(relativeAgeMinutes, publishedAtMs)
          : 'Recent Facebook Video',
        publishedAtMs,
        relativeAgeMinutes,
        viewsCount: typeof node.play_count === 'number' ? node.play_count : 0,
        reactionsCount:
          typeof node.feedback?.reaction_count?.count === 'number'
            ? node.feedback.reaction_count.count
            : 0,
        feedOrder: items.length,
      });
    }
  }

  return filterGoodFacebookVideos(deduplicateAndNormalizeVideos(items));
}
