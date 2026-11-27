import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, ExternalLink, MapPin, Play } from 'lucide-react';
import { CHURCH_MEDIA, churchConfig } from '../data/churchConfig';
import { useFacebookVideos } from '../hooks/useFacebookVideos';
import { filterActivities } from '../utils/churchLogic';
import { isSafeFacebookUrl } from '../utils/facebookVideoLogic';
import { ResilientImage } from '../components/ResilientImage';
import { MinistryIcon } from '../components/MinistryIcon';

export function HomePage() {
  const { videos: rankedVideos } = useFacebookVideos('latest');
  const [playingHomeVideo, setPlayingHomeVideo] = useState(false);
  const topThreeVideos = rankedVideos.slice(0, 3);
  const leadVideo = topThreeVideos[0];

  const featuredServices = churchConfig.services.filter((s) => s.featuredOnHome);
  const featuredMinistries = churchConfig.ministries.filter((m) => m.featured).slice(0, 4);
  const upcomingActivities = filterActivities(churchConfig.activities, 'upcoming').slice(0, 3);
  const seniorPastor = churchConfig.leadership.find((m) => m.isSeniorPastor);

  return (
    <div>
      {/* 1. Architectural Hero Section */}
      <section className="relative min-h-[540px] lg:min-h-[620px] flex items-end overflow-hidden bg-[#18181B]">
        <div className="absolute inset-0">
          <ResilientImage
            src={CHURCH_MEDIA.heroSanctuary}
            alt="Rev. Dr. Anthony Agbonmwanre Omorogieva ministering at the altar of God's Palace Evangelical Ministry Worldwide (City of the Great King)"
            loading="eager"
            className="w-full h-full object-cover object-[center_20%]"
            containerClassName="w-full h-full"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/92 via-[#0F172A]/62 to-[#0F172A]/30"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full px-5 sm:px-8 py-14 sm:py-20">
          <div className="max-w-2xl text-white">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#F2EFE9] mb-3">
              {churchConfig.identity.themeTitle} &middot; {churchConfig.identity.themeScripture}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight text-white">
              {churchConfig.identity.welcomeHeadline}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#E4E4E7] leading-relaxed max-w-xl">
              {churchConfig.identity.welcomeSubtext}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                to="/visit"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 text-sm font-medium bg-white text-[#18181B] rounded-lg hover:bg-[#F2EFE9] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Plan Your Visit</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center px-4 sm:px-5 py-3 text-sm font-medium text-white border border-white/45 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                Learn About Us
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center px-3 py-2.5 text-sm font-medium text-[#F4F4F5] hover:text-white underline underline-offset-4 decoration-white/50 transition-colors whitespace-nowrap shrink-0"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Weekly Service Schedule Strip */}
      <section aria-labelledby="home-schedule-heading" className="border-b border-[#E5E0D8] bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Gather With Us
              </p>
              <h2
                id="home-schedule-heading"
                className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-1"
              >
                Weekly Service Schedule
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap shrink-0"
            >
              <span>View all services</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {featuredServices.map((service) => (
              <div
                key={service.id}
                className="border-t border-[#E5E0D8] pt-4 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#8B6F47]">
                    {service.day}
                  </p>
                  <h3 className="font-serif text-lg font-semibold text-[#18181B] mt-1">
                    {service.name}
                  </h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#1B365D] tabular-nums">
                    <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{service.time}</span>
                  </p>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#52525B]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{service.venue}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Brief Church Introduction & Scripture Theme */}
      <section className="py-16 sm:py-20 border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 overflow-hidden rounded-xl border border-[#E5E0D8] aspect-[4/3] lg:aspect-auto">
            <ResilientImage
              src={CHURCH_MEDIA.communityFellowship}
              alt="Multi-generational church family seated together with Bibles during worship at God's Palace Evangelical Ministry Worldwide"
              className="w-full h-full object-cover object-center"
              containerClassName="w-full h-full min-h-[280px]"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              Who We Are
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-2 leading-tight">
              {churchConfig.identity.introTitle}
            </h2>
            <p className="mt-4 text-base text-[#52525B] leading-relaxed">
              {churchConfig.identity.introParagraph}
            </p>

            <blockquote className="mt-6 py-4 border-y border-[#E5E0D8]">
              <p className="font-serif italic text-lg text-[#18181B] leading-relaxed">
                &ldquo;{churchConfig.identity.scriptureQuote}&rdquo;
              </p>
              <footer className="mt-2 text-xs font-medium tracking-wider uppercase text-[#8B6F47]">
                {churchConfig.identity.themeScripture} &middot;{' '}
                {churchConfig.identity.themeTitle}
              </footer>
            </blockquote>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap"
              >
                <span>Our Vision &amp; Beliefs</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/visit"
                className="text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap"
              >
                What to expect on Sunday
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Ministries & Departments */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Serving Together
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-1">
                Ministries &amp; Departments
              </h2>
            </div>
            <Link
              to="/ministries"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Explore all ministries</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 overflow-hidden rounded-xl border border-[#E5E0D8] aspect-[4/3] lg:aspect-auto">
              <ResilientImage
                src={CHURCH_MEDIA.worshipChoir}
                alt="God's Palace Evangelical Ministry Worldwide sanctuary choir leading worship in white and royal blue uniforms"
                className="w-full h-full object-cover object-top"
                containerClassName="w-full h-full min-h-[260px]"
              />
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {featuredMinistries.map((ministry) => (
                <div
                  key={ministry.id}
                  className="p-5 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-[#F2EFE9] text-[#1B365D] flex items-center justify-center mb-3">
                      <MinistryIcon icon={ministry.icon} className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-[#18181B]">
                      {ministry.name}
                    </h3>
                    <p className="mt-2 text-sm text-[#52525B] leading-relaxed">
                      {ministry.description}
                    </p>
                  </div>
                  {ministry.schedule && (
                    <p className="mt-4 pt-3 border-t border-[#E5E0D8] text-xs text-[#71717A]">
                      {ministry.schedule}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Upcoming Church Activities & Programmes */}
      <section className="py-16 sm:py-20 border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Life of the Church
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-1">
                Upcoming Activities &amp; Programmes
              </h2>
            </div>
            <Link
              to="/activities"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap shrink-0"
            >
              <span>See full calendar</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden">
                <ResilientImage
                  src={CHURCH_MEDIA.sanctuaryPrayer}
                  alt="Congregation standing in prayer and Scripture reading inside God's Palace Evangelical Ministry Worldwide"
                  className="w-full h-full object-cover object-center"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="p-6">
                <p className="text-xs text-[#8B6F47] font-medium">
                  Featured Message &middot; {upcomingActivities[0]?.date ?? 'Latest'}
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#18181B] mt-1.5">
                  {upcomingActivities[0]?.title ?? 'Ministry Programme'}
                </h3>
                <p className="mt-2 text-sm text-[#52525B] leading-relaxed">
                  {upcomingActivities[0]?.description}
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 divide-y divide-[#E5E0D8] border-y border-[#E5E0D8]">
              {upcomingActivities.map((activity) => (
                <article key={activity.id} className="py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A] tabular-nums">
                      <span className="font-medium text-[#14532D] uppercase tracking-wider">
                        {activity.status}
                      </span>
                      <span aria-hidden="true">&middot;</span>
                      <span>{activity.category}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        {activity.date}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-[#18181B]">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-[#52525B] leading-relaxed max-w-xl">
                      {activity.description}
                    </p>
                    <p className="text-xs text-[#71717A] pt-1 tabular-nums">
                      {activity.time} &middot; {activity.venue}
                    </p>
                  </div>

                  {activity.registrationHref && (
                    <Link
                      to={activity.registrationHref}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap shrink-0 mt-1"
                    >
                      <span>{activity.registrationLabel || 'Learn more'}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5b. Connected Facebook Sermons & Videos (Automatically Ranked) */}
      {leadVideo && (
        <section className="py-16 sm:py-20 bg-[#F2EFE9]/55 border-b border-[#E5E0D8]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                  Connected With Facebook &middot; Automatically Ranked
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-1">
                  Latest Sermons &amp; Ministry Videos
                </h2>
              </div>
              <Link
                to="/videos"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Watch all ranked videos</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* #1 Latest / Top Video Card with Inline Play */}
              <div className="lg:col-span-6 bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
                <div className="aspect-video bg-[#111827] relative overflow-hidden">
                  {playingHomeVideo && isSafeFacebookUrl(leadVideo.url) && leadVideo.embedUrl ? (
                    <iframe
                      src={leadVideo.embedUrl}
                      title={leadVideo.title}
                      className="w-full h-full border-0"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPlayingHomeVideo(true)}
                      className="w-full h-full relative group text-left block"
                      aria-label={`Play latest Facebook video: ${leadVideo.title}`}
                    >
                      <ResilientImage
                        src={leadVideo.thumbnailUrl || CHURCH_MEDIA.pastorMinistry}
                        alt={leadVideo.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        containerClassName="w-full h-full"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#1B365D] text-white text-xs font-semibold tabular-nums">
                        #1 Latest
                      </span>
                      <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-medium tabular-nums">
                        {leadVideo.durationText}
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="w-14 h-14 rounded-full bg-white/95 text-[#1B365D] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </span>
                      </span>
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#8B6F47] font-medium tabular-nums">
                    <span>{leadVideo.publishedText}</span>
                    {leadVideo.viewsCount > 0 && (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <span>{leadVideo.viewsCount.toLocaleString()} views</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B] mt-1.5 leading-snug">
                    {leadVideo.title}
                  </h3>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <Link
                      to={`/videos?v=${encodeURIComponent(leadVideo.id)}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B365D] hover:underline"
                    >
                      <span>Open in Video Player</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <a
                      href={leadVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#52525B] hover:text-[#1B365D]"
                    >
                      <span>Facebook</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Ranked #1–#3 List */}
              <div className="lg:col-span-6 space-y-4">
                {topThreeVideos.map((video, index) => (
                  <Link
                    key={video.id}
                    to={`/videos?v=${encodeURIComponent(video.id)}`}
                    className="group bg-white border border-[#E5E0D8] hover:border-[#1B365D] rounded-xl p-4 flex items-center gap-4 transition-colors"
                  >
                    <div className="relative w-32 sm:w-36 aspect-video rounded-lg overflow-hidden bg-[#18181B] shrink-0">
                      <ResilientImage
                        src={video.thumbnailUrl || CHURCH_MEDIA.pastorMinistry}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                      />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#1B365D] text-white text-[11px] font-semibold tabular-nums">
                        #{index + 1}
                      </span>
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-medium tabular-nums">
                        {video.durationText}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#8B6F47] font-medium tabular-nums">
                        {video.publishedText}
                        {video.viewsCount > 0
                          ? ` · ${video.viewsCount.toLocaleString()} views`
                          : ''}
                      </p>
                      <h3 className="font-serif text-base sm:text-lg font-semibold text-[#18181B] mt-1 line-clamp-2 group-hover:text-[#1B365D] transition-colors">
                        {video.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Pastor & Leadership Introduction */}
      {seniorPastor && (
        <section className="py-16 sm:py-20 bg-white border-b border-[#E5E0D8]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-4 max-w-sm">
              <div className="aspect-[3/4] overflow-hidden rounded-xl border border-[#E5E0D8]">
                <ResilientImage
                  src={seniorPastor.photo}
                  alt={`${seniorPastor.name}, ${seniorPastor.role}`}
                  className="w-full h-full object-cover object-top"
                  containerClassName="w-full h-full"
                  fallbackTitle={seniorPastor.name}
                />
              </div>
            </div>

            <div className="lg:col-span-8">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                {churchConfig.generalOverseer.subtitle}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-2">
                {churchConfig.about.pastorWelcome.heading}
              </h2>
              <p className="mt-1 text-sm font-medium text-[#1B365D]">
                {seniorPastor.name} &middot; {seniorPastor.role}
              </p>
              <div className="mt-5 space-y-4 text-base text-[#52525B] leading-relaxed max-w-2xl">
                {churchConfig.about.pastorWelcome.message.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  to="/leadership"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap"
                >
                  <span>Meet Our General Overseer</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Visitor Connection & Prayer Request Section */}
      <section className="py-16 sm:py-20 bg-[#F2EFE9]/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                First-Time Guests
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-2">
                Planning Your First Visit?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#52525B] leading-relaxed">
                Let us know which Sunday works for you. Our welcome team can meet you at
                the entrance, guide you to children&rsquo;s check-in, and help you settle
                in comfortably.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/visit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap"
              >
                <span>Plan Your Visit</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#1B365D] border border-[#1B365D] rounded-lg hover:bg-[#1B365D] hover:text-white transition-colors whitespace-nowrap"
              >
                <span>Register as Member</span>
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Confidential Care
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-2">
                How Can We Pray For You?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#52525B] leading-relaxed">
                Our pastors and prayer ministry count it a privilege to pray with you.
                Requests are kept private and shared only according to your chosen
                preference.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/prayer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#1B365D] border border-[#1B365D] rounded-lg hover:bg-[#1B365D] hover:text-white transition-colors whitespace-nowrap"
              >
                <span>Submit Prayer Request</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
