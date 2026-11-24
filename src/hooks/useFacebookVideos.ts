import { useCallback, useEffect, useState } from 'react';
import type { FacebookVideoItem, VideoSortMode } from '../utils/facebookVideoLogic';

interface VideosFeedState {
  videos: FacebookVideoItem[];
  lastSyncedAt: string;
  syncSource: 'facebook-live' | 'facebook-graph' | 'cached';
  facebookPageUrl: string;
  facebookVideosUrl: string;
  newVideoIds: string[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
}

const DEFAULT_FACEBOOK_PAGE =
  'https://web.facebook.com/people/Gods-Palace-Evangelical-Ministry-Worldwide/100080364799775/';
const DEFAULT_FACEBOOK_VIDEOS =
  'https://www.facebook.com/profile.php?id=100080364799775&sk=videos';

export function useFacebookVideos(initialSort: VideoSortMode = 'latest') {
  const [sortMode, setSortMode] = useState<VideoSortMode>(initialSort);
  const [state, setState] = useState<VideosFeedState>({
    videos: [],
    lastSyncedAt: '',
    syncSource: 'cached',
    facebookPageUrl: DEFAULT_FACEBOOK_PAGE,
    facebookVideosUrl: DEFAULT_FACEBOOK_VIDEOS,
    newVideoIds: [],
    loading: true,
    syncing: false,
    error: null,
  });

  const fetchFeed = useCallback(async (mode: VideoSortMode) => {
    try {
      const response = await fetch(`/api/videos?sort=${encodeURIComponent(mode)}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Could not load Facebook videos.');
      }
      setState((prev) => ({
        ...prev,
        videos: Array.isArray(data.videos) ? data.videos : [],
        lastSyncedAt: data.lastSyncedAt || '',
        syncSource: data.syncSource || 'cached',
        facebookPageUrl: data.facebookPageUrl || DEFAULT_FACEBOOK_PAGE,
        facebookVideosUrl: data.facebookVideosUrl || DEFAULT_FACEBOOK_VIDEOS,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unable to load Facebook videos.',
      }));
    }
  }, []);

  useEffect(() => {
    void fetchFeed(sortMode);

    if (typeof EventSource === 'undefined') {
      return undefined;
    }

    const stream = new EventSource(`/api/videos/stream?sort=${encodeURIComponent(sortMode)}`);
    const handleUpdate = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data);
        if (!data || !Array.isArray(data.videos)) return;
        setState((prev) => ({
          ...prev,
          videos: data.videos,
          lastSyncedAt: data.lastSyncedAt || prev.lastSyncedAt,
          syncSource: data.syncSource || prev.syncSource,
          facebookPageUrl: data.facebookPageUrl || prev.facebookPageUrl,
          facebookVideosUrl: data.facebookVideosUrl || prev.facebookVideosUrl,
          newVideoIds: Array.isArray(data.newVideoIds) ? data.newVideoIds : [],
          loading: false,
          error: null,
        }));
      } catch {
        // Ignore malformed event frame
      }
    };

    stream.addEventListener('videos-updated', handleUpdate as EventListener);
    return () => {
      stream.removeEventListener('videos-updated', handleUpdate as EventListener);
      stream.close();
    };
  }, [sortMode, fetchFeed]);

  const syncNow = useCallback(async () => {
    setState((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      const response = await fetch(`/api/videos/sync?sort=${encodeURIComponent(sortMode)}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Could not sync videos from Facebook.');
      }
      setState((prev) => ({
        ...prev,
        videos: Array.isArray(data.videos) ? data.videos : prev.videos,
        lastSyncedAt: data.lastSyncedAt || prev.lastSyncedAt,
        syncSource: data.syncSource || prev.syncSource,
        newVideoIds: Array.isArray(data.newVideoIds) ? data.newVideoIds : prev.newVideoIds,
        syncing: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        syncing: false,
        error: err instanceof Error ? err.message : 'Unable to refresh Facebook videos right now.',
      }));
    }
  }, [sortMode]);

  return {
    ...state,
    sortMode,
    setSortMode,
    syncNow,
  };
}
