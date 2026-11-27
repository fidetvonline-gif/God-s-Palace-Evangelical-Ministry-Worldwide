import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CHURCH_MEDIA, churchConfig } from '../data/churchConfig';
import { PageHeader } from '../components/PageHeader';
import { ResilientImage } from '../components/ResilientImage';

export function AboutPage() {
  return (
    <div>
      <PageHeader
        eyebrow="About the Church"
        title={`Our Story, Vision & Beliefs at ${churchConfig.identity.name}`}
        description={churchConfig.about.overview}
      />

      {/* History & Community Image */}
      <section className="py-14 sm:py-16 border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              Church History
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#18181B]">
              Our Heritage &amp; Journey
            </h2>
            <div className="space-y-4 text-base text-[#52525B] leading-relaxed max-w-prose">
              {churchConfig.about.history.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-[#E5E0D8] aspect-[4/3]">
              <ResilientImage
                src={CHURCH_MEDIA.sanctuaryPrayer}
                alt="Members standing in prayer and Scripture reading inside the GPEMWW sanctuary"
                className="w-full h-full object-cover object-center"
                containerClassName="w-full h-full"
              />
            </div>
            <p className="mt-2.5 text-xs italic text-[#71717A]">
              Members standing in prayer and Scripture reading inside the GPEMWW sanctuary.
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-14 sm:py-16 bg-white border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-7 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6]">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              Our Vision
            </p>
            <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-2">
              Where God Is Leading Us
            </h2>
            <p className="mt-3 text-base text-[#52525B] leading-relaxed">
              {churchConfig.about.vision}
            </p>
          </div>

          <div className="p-7 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6]">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              Our Mission
            </p>
            <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-2">
              What We Are Called To Do
            </h2>
            <p className="mt-3 text-base text-[#52525B] leading-relaxed">
              {churchConfig.about.mission}
            </p>
          </div>
        </div>
      </section>

      {/* Statement of Faith / Beliefs */}
      <section className="py-14 sm:py-16 border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              Statement of Faith
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#18181B] mt-1">
              Core Beliefs
            </h2>
            <p className="mt-3 text-sm text-[#52525B]">
              Editable placeholder doctrinal summary. Replace with your church&rsquo;s
              official confession or statement of faith.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {churchConfig.about.beliefs.map((belief, index) => (
              <div
                key={belief.title}
                className="p-6 bg-white border border-[#E5E0D8] rounded-xl"
              >
                <p className="text-xs font-medium text-[#8B6F47] tabular-nums">
                  0{index + 1}.
                </p>
                <h3 className="font-serif text-xl font-semibold text-[#18181B] mt-1">
                  {belief.title}
                </h3>
                <p className="mt-2.5 text-sm text-[#52525B] leading-relaxed">
                  {belief.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values & Church Objectives */}
      <section className="py-14 sm:py-16 bg-white border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              Core Values
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#18181B] mt-1 mb-6">
              How We Walk Together
            </h2>
            <div className="divide-y divide-[#E5E0D8] border-y border-[#E5E0D8]">
              {churchConfig.about.coreValues.map((value) => (
                <div key={value.title} className="py-4">
                  <h3 className="font-serif text-lg font-semibold text-[#18181B]">
                    {value.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#52525B] leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              Church Objectives
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#18181B] mt-1 mb-6">
              Our Pastoral Focus
            </h2>
            <ol className="space-y-4">
              {churchConfig.about.objectives.map((objective, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6]"
                >
                  <span className="font-serif text-lg font-semibold text-[#1B365D] tabular-nums shrink-0">
                    0{idx + 1}
                  </span>
                  <span className="text-sm sm:text-base text-[#3F3F46] leading-relaxed">
                    {objective}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Pastor's Welcome Message */}
      <section className="py-14 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
            Pastoral Note
          </p>
          <h2 className="font-serif text-3xl font-semibold text-[#18181B] mt-2">
            {churchConfig.about.pastorWelcome.heading}
          </h2>
          <div className="mt-6 space-y-4 text-base text-[#52525B] leading-relaxed text-left max-w-2xl mx-auto">
            {churchConfig.about.pastorWelcome.message.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-6 font-serif text-lg font-medium text-[#18181B]">
            {churchConfig.about.pastorWelcome.authorName}
          </p>
          <p className="text-xs text-[#71717A]">
            {churchConfig.about.pastorWelcome.authorTitle}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/visit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors"
            >
              <span>Plan Your Visit</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/leadership"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[#18181B] border border-[#D6D0C4] bg-white rounded-lg hover:bg-[#F2EFE9] transition-colors"
            >
              Meet Our Leadership
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
