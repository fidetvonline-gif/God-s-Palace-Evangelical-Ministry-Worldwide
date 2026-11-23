import { Clock, ExternalLink, MapPin, Phone } from 'lucide-react';
import { churchConfig } from '../data/churchConfig';
import { buildGoogleMapsUrl } from '../utils/churchLogic';
import { PageHeader } from '../components/PageHeader';
import { SubmissionForm } from '../components/SubmissionForm';

export function VisitPage() {
  const mapsUrl = buildGoogleMapsUrl(churchConfig.contact.fullAddress);

  return (
    <div>
      <PageHeader
        eyebrow="Plan Your Visit"
        title={churchConfig.visitGuide.welcomeHeading}
        description={churchConfig.visitGuide.welcomeBody}
      />

      <section className="py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: What to Expect & Location Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                First-Time Guide
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-1">
                What to Expect
              </h2>
              <div className="mt-5 divide-y divide-[#E5E0D8] border-y border-[#E5E0D8]">
                {churchConfig.visitGuide.whatToExpect.map((item) => (
                  <div key={item.title} className="py-4">
                    <h3 className="font-serif text-lg font-semibold text-[#18181B]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#52525B] leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 space-y-4">
              <h3 className="font-serif text-xl font-semibold text-[#18181B]">
                Worship Times &amp; Address
              </h3>
              <div className="space-y-3 text-sm text-[#52525B]">
                <div className="flex items-start gap-2.5 tabular-nums">
                  <Clock
                    className="w-4 h-4 text-[#1B365D] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    {churchConfig.services.slice(0, 2).map((service) => (
                      <p key={service.id}>
                        <strong className="font-medium text-[#18181B]">
                          {service.name}:
                        </strong>{' '}
                        {service.day} · {service.time}
                      </p>
                    ))}
                  </div>
                </div>
                <p className="flex items-start gap-2.5">
                  <MapPin
                    className="w-4 h-4 text-[#1B365D] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{churchConfig.contact.fullAddress}</span>
                </p>
                <p className="flex items-center gap-2.5 tabular-nums">
                  <Phone className="w-4 h-4 text-[#1B365D] shrink-0" aria-hidden="true" />
                  <a
                    href={`tel:${churchConfig.contact.phone.replace(/[^\d+]/g, '')}`}
                    className="hover:text-[#1B365D]"
                  >
                    {churchConfig.contact.phone}
                  </a>
                </p>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B365D] hover:underline"
              >
                <span>Open Directions in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Right Column: First-Time Visitor Form */}
          <div className="lg:col-span-7">
            <div className="mb-5">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Connect With Us
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-1">
                Let Us Know You&rsquo;re Coming
              </h2>
              <p className="mt-2 text-sm text-[#52525B]">
                Share a few details so our hospitality team can prepare a warm welcome.
              </p>
            </div>
            <SubmissionForm mode="visitor" />
          </div>
        </div>
      </section>
    </div>
  );
}
