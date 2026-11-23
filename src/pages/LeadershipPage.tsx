import { Mail } from 'lucide-react';
import { churchConfig } from '../data/churchConfig';
import { PageHeader } from '../components/PageHeader';
import { ResilientImage } from '../components/ResilientImage';

function getInitials(name: string): string {
  const parts = name
    .replace(/^(Pastor|Elder|Deaconess|Deacon)\s+/i, '')
    .trim()
    .split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function LeadershipPage() {
  const seniorPastor = churchConfig.leadership.find((member) => member.isSeniorPastor);
  const otherLeaders = churchConfig.leadership.filter((member) => !member.isSeniorPastor);

  return (
    <div>
      <PageHeader
        eyebrow="Church Leadership"
        title="Pastors & Leaders Serving Our Congregation"
        description="Meet the pastors, elders, and ministry leaders who shepherd, teach, and care for our church family."
      />

      {seniorPastor && (
        <section className="py-14 sm:py-16 bg-white border-b border-[#E5E0D8]">
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
                {seniorPastor.role}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#18181B] mt-2">
                {seniorPastor.name}
              </h2>
              <p className="mt-4 text-base text-[#52525B] leading-relaxed max-w-2xl">
                {seniorPastor.bio}
              </p>
              {seniorPastor.email && (
                <a
                  href={`mailto:${seniorPastor.email}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#1B365D] hover:underline"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>{seniorPastor.email}</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-14 sm:py-16">
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
    </div>
  );
}
