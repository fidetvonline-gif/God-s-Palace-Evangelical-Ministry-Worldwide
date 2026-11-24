import { ArrowRight, Award, BookOpen, GraduationCap, Heart, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { churchConfig } from '../data/churchConfig';
import { ResilientImage } from '../components/ResilientImage';

function getInitials(name: string): string {
  const parts = name
    .replace(/^(Rev\.|Dr\.|Pastor|Elder|Deaconess|Deacon)\s+/gi, '')
    .trim()
    .split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function LeadershipPage() {
  const go = churchConfig.generalOverseer;
  const otherLeaders = churchConfig.leadership.filter((member) => !member.isSeniorPastor);

  return (
    <div>
      {/* 1. General Overseer Hero Section */}
      <section className="py-14 sm:py-20 bg-white border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-5 max-w-md mx-auto lg:mx-0 w-full">
            <div className="aspect-[3/4] overflow-hidden rounded-xl border border-[#E5E0D8] shadow-sm">
              <ResilientImage
                src={go.photo}
                alt={`${go.fullName}, ${go.role}`}
                className="w-full h-full object-cover object-top"
                containerClassName="w-full h-full"
                fallbackTitle={go.fullName}
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              {go.eyebrow} &middot; {churchConfig.identity.shortName}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-[#18181B] leading-[1.15] mt-2">
              {go.headline}
            </h1>
            <p className="mt-3 font-serif italic text-lg sm:text-xl text-[#8B6F47]">
              {go.subtitle}
            </p>
            <p className="mt-5 text-base text-[#52525B] leading-relaxed">
              {go.overview}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                to="/visit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap"
              >
                <span>Plan Your Visit</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <a
                href={`mailto:${go.email}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#1B365D] border border-[#D6D0C4] bg-[#FAF9F6] rounded-lg hover:bg-[#F2EFE9] transition-colors"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>{go.email}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Call & Ministry Mandate */}
      <section className="py-14 sm:py-16 border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              {go.mandate.eyebrow}
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#18181B] mt-1">
              {go.mandate.heading}
            </h2>
            <p className="mt-3 text-sm text-[#52525B] leading-relaxed">
              Ukana, Essien Udim LGA &middot; Ikot Anwa &middot; Federal Polytechnic Ukana
              Annex Campus Road
            </p>
          </div>

          <div className="lg:col-span-8 bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-8 space-y-4">
            {go.mandate.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-base text-[#3F3F46] leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Academic & Leadership Excellence */}
      <section className="py-14 sm:py-16 bg-white border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              {go.academic.eyebrow}
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#18181B] mt-1">
              {go.academic.heading}
            </h2>
            <p className="mt-3 text-base text-[#52525B] leading-relaxed">
              {go.academic.intro}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {go.academic.credentials.map((cred) => (
              <div
                key={`${cred.degree}-${cred.institution}`}
                className="p-6 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6] flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#F2EFE9] text-[#1B365D] flex items-center justify-center mb-4">
                    <GraduationCap className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#8B6F47]">
                    {cred.honour ? `${cred.degree} · ${cred.honour}` : cred.degree}
                  </p>
                  <h3 className="font-serif text-xl font-semibold text-[#18181B] mt-1.5">
                    {cred.institution}
                  </h3>
                  <p className="mt-2 text-sm text-[#52525B] leading-relaxed">
                    {cred.field}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 p-6 rounded-xl border border-[#E5E0D8] bg-[#1B365D] text-white flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center mb-4">
                  <Award className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#E5D3B3]">
                  Higher Education Leadership
                </p>
                <h3 className="font-serif text-xl font-semibold mt-1.5">
                  Federal Polytechnic Ukana
                </h3>
                <p className="mt-2 text-sm text-[#E4E4E7] leading-relaxed">
                  Lecturer in Management and Acting Director of Academic Planning,
                  mentoring future leaders in character and academic excellence.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6] flex flex-col justify-center">
              <div className="flex items-center gap-2.5 text-xs font-medium tracking-[0.12em] uppercase text-[#8B6F47] mb-2">
                <BookOpen className="w-4 h-4 text-[#1B365D]" aria-hidden="true" />
                <span>Bridging Faith &amp; Intellect</span>
              </div>
              <p className="text-base text-[#3F3F46] leading-relaxed">
                {go.academic.researchSummary}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Family & First Home */}
      <section className="py-14 sm:py-16 border-b border-[#E5E0D8] bg-[#F2EFE9]/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#F2EFE9] text-[#1B365D] flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                  {go.family.eyebrow}
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B]">
                  {go.family.heading}
                </h2>
              </div>
            </div>
            <p className="mt-4 text-base text-[#52525B] leading-relaxed">
              {go.family.body}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Assistant Pastors & Church Leaders */}
      <section className="py-14 sm:py-16 border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="mb-10">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              Ministry &amp; Council
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#18181B] mt-1">
              Assistant Pastors &amp; Church Leaders
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherLeaders.map((leader) => (
              <article
                key={leader.id}
                className="bg-white border border-[#E5E0D8] rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  {leader.photo ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden border border-[#E5E0D8] mb-4">
                      <ResilientImage
                        src={leader.photo}
                        alt={leader.name}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-14 h-14 rounded-full bg-[#F2EFE9] border border-[#E5E0D8] text-[#1B365D] font-serif text-lg font-semibold flex items-center justify-center mb-4"
                    >
                      {getInitials(leader.name)}
                    </div>
                  )}

                  <p className="text-xs font-medium text-[#8B6F47]">{leader.role}</p>
                  <h3 className="font-serif text-xl font-semibold text-[#18181B] mt-1">
                    {leader.name}
                  </h3>
                  <p className="mt-3 text-sm text-[#52525B] leading-relaxed">
                    {leader.bio}
                  </p>
                </div>

                {leader.email && (
                  <a
                    href={`mailto:${leader.email}`}
                    className="mt-5 pt-4 border-t border-[#E5E0D8] inline-flex items-center gap-2 text-xs font-medium text-[#1B365D] hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{leader.email}</span>
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Plan Your Visit Location Callout */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
              Worship With Us
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-1">
              Plan Your Visit to God&rsquo;s Palace
            </h2>
            <p className="mt-2 flex items-start gap-2 text-sm text-[#52525B]">
              <MapPin className="w-4 h-4 text-[#1B365D] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{churchConfig.contact.fullAddress}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/visit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap"
            >
              <span>Plan Your Visit</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-[#18181B] border border-[#D6D0C4] bg-[#FAF9F6] rounded-lg hover:bg-[#F2EFE9] transition-colors whitespace-nowrap"
            >
              Contact Office
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
