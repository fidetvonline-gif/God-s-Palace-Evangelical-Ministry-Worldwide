import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { churchConfig } from '../data/churchConfig';
import { PageHeader } from '../components/PageHeader';
import { MinistryIcon } from '../components/MinistryIcon';
import { ResilientImage } from '../components/ResilientImage';

export function MinistriesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Serving & Fellowship"
        title="Departments & Ministries"
        description="Every member has a place to grow, build friendships, and serve the church family. Explore our ministries and find out how to connect."
      />

      <section className="py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {churchConfig.ministries.map((ministry) => (
              <article
                key={ministry.id}
                className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {ministry.image && (
                    <div className="aspect-[4/3] overflow-hidden border-b border-[#E5E0D8]">
                      <ResilientImage
                        src={ministry.image}
                        alt={ministry.name}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-[#F2EFE9] text-[#1B365D] flex items-center justify-center shrink-0">
                        <MinistryIcon icon={ministry.icon} className="w-5 h-5" />
                      </div>
                      <h2 className="font-serif text-xl font-semibold text-[#18181B]">
                        {ministry.name}
                      </h2>
                    </div>

                    <p className="text-sm font-medium text-[#1B365D] leading-snug">
                      {ministry.purpose}
                    </p>
                    <p className="mt-2.5 text-sm text-[#52525B] leading-relaxed">
                      {ministry.description}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-[#E5E0D8] space-y-2 text-xs text-[#52525B]">
                  {ministry.schedule && (
                    <p className="flex items-center gap-1.5 font-medium text-[#18181B] tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-[#8B6F47]" aria-hidden="true" />
                      <span>{ministry.schedule}</span>
                    </p>
                  )}
                  {ministry.contactInfo && <p>{ministry.contactInfo}</p>}
                  <div className="pt-1">
                    <Link
                      to={`/contact?subject=${encodeURIComponent(`Joining ${ministry.name}`)}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#1B365D] hover:underline"
                    >
                      <span>Ask about this ministry</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
