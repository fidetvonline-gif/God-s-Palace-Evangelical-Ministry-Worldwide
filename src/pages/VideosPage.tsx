import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  ExternalLink,
  Eye,
  Flame,
  Heart,
  Play,
  RefreshCw,
  Video,
} from 'lucide-react';
import { CHURCH_MEDIA, churchConfig } from '../data/churchConfig';
import { useFacebookVideos } from '../hooks/useFacebookVideos';
import { isSafeFacebookUrl, type VideoSortMode } from '../utils/facebookVideoLogic';
import { PageHeader } from '../components/PageHeader';
import { ResilientImage } from '../components/ResilientImage';

const SORT_OPTIONS: Array<{ id: VideoSortMode; label: string }> = [
  { id: 'latest', label: 'Latest Posted' },
  { id: 'popular', label: 'Most Viewed' },
  { id: 'duration', label: 'Longest Messages' },
];

export function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    videos,
    lastSyncedAt,
    facebookPageUrl,
    facebookVideosUrl,
    newVideoIds,
    loading,
    syncing,
    error,
    sortMode,
    setSortMode,
    syncNow,
  } = useFacebookVideos('latest');

  const requestedId = searchParams.get('v');
  const [selectedId, setSelectedId] = useState<string | null>(requestedId);
  const [showLiveFeedFrame, setShowLiveFeedFrame] = useState(false);

  useEffect(() => {
    if (requestedId) {
      setSelectedId(requestedId);
    }
  }, [requestedId]);

  const activeVideo = useMemo(() => {
    if (videos.length === 0) return null;
    if (selectedId) {
      const found = videos.find((v) => v.id === selectedId);
      if (found) return found;
    }
    return videos[0];
  }, [videos, selectedId]);

  const activeRank = activeVideo
    ? videos.findIndex((v) => v.id === activeVideo.id) + 1
    : 1;

  const formattedSyncTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Connected';

  const pagePluginUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
    churchConfig.contact.facebookUrl,
  )}&tabs=timeline&width=500&height=560&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;

  return (
    <div>
      <PageHeader
        eyebrow="Sermons &amp; Ministry Videos"
        title="Connected Live With Our Church Facebook Page"
        description="Every message, worship clip, and prayer broadcast posted on God's Palace Evangelical Ministry Worldwide (GPEMWW) on Facebook connects and ranks automatically here."
      />

      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-12">
          {/* Ranking Tabs & Sync Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Video ranking order">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={sortMode === option.id}
                  onClick={() => setSortMode(option.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    sortMode === option.id
                      ? 'bg-[#1B365D] text-white'
                      : 'bg-white border border-[#E5E0D8] text-[#3F3F46] hover:bg-[#F2EFE9]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#52525B]">
              <span className="tabular-nums">Listening &amp; synced from Facebook &middot; {formattedSyncTime}</span>
              <button
                type="button"
                onClick={() => void syncNow()}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#1B365D] bg-white border border-[#D6D0C4] hover:bg-[#F2EFE9] disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{syncing ? 'Checking Facebook...' : 'Sync New Videos'}</span>
              </button>
              <a
                href={facebookVideosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1B365D] hover:underline whitespace-nowrap"
              >
                <span>Open on Facebook</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {newVideoIds.length > 0 && (
            <div
              role="status"
              className="p-4 rounded-xl border border-[#C6BEB0] bg-[#F2EFE9] text-sm text-[#18181B] flex flex-wrap items-center justify-between gap-3"
            >
              <span>
                <strong>{newVideoIds.length}</strong> new church{' '}
                {newVideoIds.length === 1 ? 'video was' : 'videos were'} just picked up from Facebook,
                auto-titled, and ranked here.
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(newVideoIds[0]);
                  setSearchParams({ v: newVideoIds[0] });
                }}
                className="text-xs font-semibold text-[#1B365D] hover:underline whitespace-nowrap"
              >
                Watch newest upload
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-sm text-[#991B1B]"
            >
              {error}
            </div>
          )}

          {/* Featured Player for Selected / #1 Ranked Video */}
          {loading ? (
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-10 text-center text-sm text-[#52525B]">
              Loading latest sermons and videos from God&rsquo;s Palace Evangelical Ministry Worldwide...
            </div>
          ) : activeVideo ? (
            <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 bg-[#111827] aspect-video flex items-center justify-center">
                {isSafeFacebookUrl(activeVideo.url) && activeVideo.embedUrl ? (
                  <iframe
                    key={activeVideo.id}
                    src={activeVideo.embedUrl}
                    title={activeVideo.title}
                    className="w-full h-full border-0"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <ResilientImage
                    src={activeVideo.thumbnailUrl || CHURCH_MEDIA.pastorMinistry}
                    alt={activeVideo.title}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                )}
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#8B6F47] tabular-nums">
                    <span>Rank #{activeRank}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>
                      {sortMode === 'latest'
                        ? 'Latest Message'
                        : sortMode === 'popular'
                          ? 'Top Viewed'
                          : 'Featured Length'}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{activeVideo.publishedText}</span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-2 leading-snug">
                    {activeVideo.title}
                  </h2>

                  {activeVideo.originalTitle &&
                    activeVideo.originalTitle !== activeVideo.title &&
                    !/^god'?s palace evangelical ministry worldwide'?s video$/i.test(
                      activeVideo.originalTitle,
                    ) && (
                      <p className="mt-3 text-sm text-[#52525B] leading-relaxed line-clamp-3">
                        {activeVideo.originalTitle}
                      </p>
                    )}

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#52525B] tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#1B365D]" aria-hidden="true" />
                      {activeVideo.durationText}
                    </span>
                    {activeVideo.viewsCount > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-[#1B365D]" aria-hidden="true" />
                        {activeVideo.viewsCount.toLocaleString()} views
                      </span>
                    )}
                    {activeVideo.reactionsCount > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-[#8B6F47]" aria-hidden="true" />
                        {activeVideo.reactionsCount.toLocaleString()} reactions
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[#71717A]">
                    Posted by {churchConfig.identity.shortName} on Facebook
                  </span>
                  <a
                    href={activeVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap"
                  >
                    <span>Watch on Facebook</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {/* Automatically Ranked Video Grid */}
          {videos.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
                <div>
                  <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                    Ranked Video Archive
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-1">
                    {sortMode === 'latest'
                      ? 'Newest Church Videos First'
                      : sortMode === 'popular'
                        ? 'Most Watched Ministry Videos'
                        : 'Full Messages & Teachings'}
                  </h2>
                </div>
                <p className="text-xs text-[#71717A] tabular-nums">
                  Showing {videos.length} connected Facebook videos
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video, index) => {
                  const rank = index + 1;
                  const isSelected = activeVideo?.id === video.id;
                  return (
                    <article
                      key={video.id}
                      className={`bg-white rounded-xl border overflow-hidden flex flex-col justify-between transition-colors ${
                        isSelected
                          ? 'border-[#1B365D] ring-1 ring-[#1B365D]'
                          : 'border-[#E5E0D8] hover:border-[#C6BEB0]'
                      }`}
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(video.id);
                            setSearchParams({ v: video.id });
                            window.scrollTo({ top: 180, behavior: 'smooth' });
                          }}
                          className="w-full text-left group relative block aspect-video overflow-hidden bg-[#18181B]"
                          aria-label={`Play ranked video #${rank}: ${video.title}`}
                        >
                          <ResilientImage
                            src={video.thumbnailUrl || CHURCH_MEDIA.pastorMinistry}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            containerClassName="w-full h-full"
                          />
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#1B365D] text-white text-xs font-semibold tabular-nums">
                            #{rank}
                          </span>
                          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-medium tabular-nums">
                            {video.durationText}
                          </span>
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <span className="w-11 h-11 rounded-full bg-white/90 text-[#1B365D] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </span>
                          </span>
                        </button>

                        <div className="p-5">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A] tabular-nums">
                            <span className="font-medium text-[#8B6F47]">
                              {video.publishedText}
                            </span>
                            {video.viewsCount > 0 && (
                              <>
                                <span aria-hidden="true">&middot;</span>
                                <span>{video.viewsCount.toLocaleString()} views</span>
                              </>
                            )}
                            {video.reactionsCount > 0 && (
                              <>
                                <span aria-hidden="true">&middot;</span>
                                <span>{video.reactionsCount} likes</span>
                              </>
                            )}
                          </div>

                          <h3 className="font-serif text-lg font-semibold text-[#18181B] mt-2 line-clamp-2 leading-snug">
                            {video.title}
                          </h3>
                        </div>
                      </div>

                      <div className="px-5 pb-4 pt-3 border-t border-[#E5E0D8] flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(video.id);
                            setSearchParams({ v: video.id });
                            window.scrollTo({ top: 180, behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B365D] hover:underline"
                        >
                          <Video className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{isSelected ? 'Now Playing Above' : 'Play on Site'}</span>
                        </button>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#52525B] hover:text-[#1B365D]"
                        >
                          <span>Facebook</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direct Facebook Page Timeline Embed */}
          <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Official Facebook Connection
              </p>
              <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-1">
                Follow God&rsquo;s Palace Evangelical Ministry Worldwide
              </h2>
              <p className="mt-2 text-sm text-[#52525B] leading-relaxed">
                This website listens continuously to the church&rsquo;s Facebook page so newly
                uploaded reels, sermons, and prayer broadcasts are picked up automatically, given a
                clean sermon title, and ranked here without manual work.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLiveFeedFrame((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#1B365D] bg-[#F2EFE9] rounded-lg hover:bg-[#E7E2D8] transition-colors"
                >
                  <Flame className="w-4 h-4" aria-hidden="true" />
                  <span>{showLiveFeedFrame ? 'Hide Live Timeline' : 'Open Live Facebook Timeline'}</span>
                </button>
                <a
                  href={facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#18181B] border border-[#D6D0C4] rounded-lg hover:bg-[#FAF9F6] transition-colors"
                >
                  <span>Visit Facebook Page</span>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            {showLiveFeedFrame && (
              <div className="w-full lg:w-[500px] shrink-0 overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#FAF9F6]">
                <iframe
                  src={pagePluginUrl}
                  title="God's Palace Evangelical Ministry Worldwide Facebook Timeline"
                  className="w-full h-[560px] border-0"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
