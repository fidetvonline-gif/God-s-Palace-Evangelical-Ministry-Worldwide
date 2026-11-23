import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { CHURCH_MEDIA, churchConfig } from '../data/churchConfig';
import { PageHeader } from '../components/PageHeader';
import { ResilientImage } from '../components/ResilientImage';

export function ServicesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Worship & Gatherings"
        title="Weekly Service Schedule"
        description="Join us on Sundays and throughout the week for worship, biblical teaching, prayer, and fellowship across all ages."
      />

      <section className="py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-5">
            {churchConfig.services.map((service) => (
              <article
                key={service.id}
                className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#8B6F47] uppercase tracking-wider">
                  <span>{service.day}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="tabular-nums text-[#1B365D]">{service.time}</span>
                </div>
                <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-1.5">
                  {service.name}
                </h2>
                <p className="mt-2.5 text-sm sm:text-base text-[#52525B] leading-relaxed">
                  {service.description}
                </p>
                <div className="mt-4 pt-4 border-t border-[#E5E0D8] flex flex-wrap items-center gap-5 text-xs text-[#52525B]">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-[#1B365D]" aria-hidden="true" />
                    {service.time}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1B365D]" aria-hidden="true" />
                    {service.venue}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden">
                <ResilientImage
                  src={CHURCH_MEDIA.heroSanctuary}
                  alt="Main sanctuary seating and natural timber ceiling"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="p-6">
                <h2 className="font-serif text-2xl font-semibold text-[#18181B]">
                  Joining Us for the First Time?
                </h2>
                <p className="mt-2 text-sm text-[#52525B] leading-relaxed">
                  Doors open 20 minutes before every Sunday service with coffee in the
                  foyer and safe check-in for children.
                </p>
                <p className="mt-3 text-sm text-[#18181B] font-medium">
                  {churchConfig.contact.fullAddress}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to="/visit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors"
                  >
                    <span>Plan Your Visit</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/prayer"
                    className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-[#18181B] border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors"
                  >
                    Prayer Request
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
