import fs from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { generateCleanVideoTitle, type FacebookVideoItem } from '../utils/facebookVideoLogic.ts';

interface CachedTitleEntry {
  title: string;
  source: 'ai' | 'auto';
  rawCaption: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TITLES_CACHE_FILE = path.join(DATA_DIR, 'video-titles-cache.json');

let memoryTitleCache: Record<string, CachedTitleEntry> | null = null;
let cachedGeminiClient: { apiKey: string; client: GoogleGenAI } | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  if (!cachedGeminiClient || cachedGeminiClient.apiKey !== apiKey) {
    cachedGeminiClient = {
      apiKey,
      client: new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      }),
    };
  }
  return cachedGeminiClient.client;
}

async function loadTitleCache(): Promise<Record<string, CachedTitleEntry>> {
  if (memoryTitleCache) return memoryTitleCache;
  try {
    const raw = await fs.readFile(TITLES_CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, CachedTitleEntry>;
    if (parsed && typeof parsed === 'object') {
      memoryTitleCache = parsed;
      return memoryTitleCache;
    }
  } catch {
    // Cache not initialized yet
  }
  memoryTitleCache = {};
  return memoryTitleCache;
}

async function saveTitleCache(cache: Record<string, CachedTitleEntry>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TITLES_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

async function generateAiTitleForVideo(
  ai: GoogleGenAI,
  video: FacebookVideoItem,
  thumbFilePath: string | null,
): Promise<{ title: string; error?: string } | null> {
  const rawCaption = (video.originalTitle || video.title || '').trim();
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (thumbFilePath) {
    try {
      const imgBuffer = await fs.readFile(thumbFilePath);
      if (imgBuffer.length > 0 && imgBuffer.length < 4_000_000) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imgBuffer.toString('base64'),
          },
        });
      }
    } catch {
      // Proceed with text metadata only if thumbnail is not yet cached on disk
    }
  }

  parts.push({
    text: [
      "Generate one clear, dignified, engaging title (4 to 10 words) for a church video uploaded by God's Palace Evangelical Ministry Worldwide (Rev. Dr. Anthony Agbonmwanre Omorogieva).",
      `Duration: ${video.durationText}`,
      rawCaption ? `Facebook caption: "${rawCaption}"` : 'Facebook caption: (none provided)',
      'Rules: Do not use ALL CAPS, do not repeat social calls like "listen and be blessed" or "see you in church", and if the caption is blank or generic, describe what is clearly visible in the thumbnail (e.g., Sunday Praise, Prayer Charge, Word Ministration) naturally.',
    ].join('\n'),
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'A clear, concise 4-to-10-word church video title.',
            },
          },
          required: ['title'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as { title?: string };
    const clean = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    if (clean.length >= 4 && clean.length <= 100) {
      return { title: clean };
    }
    return null;
  } catch (err) {
    return {
      title: '',
      error: err instanceof Error ? err.message : 'Unable to generate AI title.',
    };
  }
}

async function generateAiTitleWithRetry(
  ai: GoogleGenAI,
  video: FacebookVideoItem,
  thumbFilePath: string | null,
): Promise<{ title: string; error?: string } | null> {
  const first = await generateAiTitleForVideo(ai, video, thumbFilePath);
  if (first && first.title) return first;
  if (first?.error && /429|quota|rate|exhausted|timeout/i.test(first.error)) {
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    return generateAiTitleForVideo(ai, video, thumbFilePath);
  }
  return first;
}

export async function applyAutomaticVideoTitles(
  videos: FacebookVideoItem[],
  resolveThumbPath: (videoId: string) => string | null,
): Promise<{ videos: FacebookVideoItem[]; aiError?: string }> {
  const cache = await loadTitleCache();
  const ai = getGeminiClient();
  let cacheDirty = false;
  let lastAiError: string | undefined;

  const results: FacebookVideoItem[] = new Array(videos.length);
  let nextIndex = 0;
  const concurrency = ai ? 2 : videos.length;

  async function worker() {
    while (nextIndex < videos.length) {
      const idx = nextIndex++;
      const video = videos[idx];
      const rawCaption = video.originalTitle || video.title || '';
      const autoTitle = generateCleanVideoTitle(rawCaption, video.durationSeconds);
      const cached = cache[video.id];

      // Reuse previously AI-generated title when the Facebook caption hasn't changed
      if (cached && cached.source === 'ai' && cached.rawCaption === rawCaption) {
        results[idx] = {
          ...video,
          title: cached.title,
          originalTitle: rawCaption || video.originalTitle,
          titleSource: 'ai',
        };
        continue;
      }

      if (ai) {
        const thumbPath = resolveThumbPath(video.id);
        const aiResult = await generateAiTitleWithRetry(ai, video, thumbPath);
        if (aiResult && aiResult.title) {
          cache[video.id] = {
            title: aiResult.title,
            source: 'ai',
            rawCaption,
            updatedAt: new Date().toISOString(),
          };
          cacheDirty = true;
          results[idx] = {
            ...video,
            title: aiResult.title,
            originalTitle: rawCaption || video.originalTitle,
            titleSource: 'ai',
          };
          continue;
        }
        if (aiResult?.error) {
          lastAiError = aiResult.error;
        }
      }

      results[idx] = {
        ...video,
        title: autoTitle,
        originalTitle: rawCaption || video.originalTitle,
        titleSource: 'auto',
      };
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, videos.length)) }, () => worker()));

  if (cacheDirty) {
    await saveTitleCache(cache).catch(() => {});
  }

  return { videos: results, aiError: lastAiError };
}
