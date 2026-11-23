import { useSearchParams } from 'react-router-dom';
import { ExternalLink, Mail, MapPin, MessageCircle, Phone, Clock } from 'lucide-react';
import { churchConfig } from '../data/churchConfig';
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsUrl,
  buildWhatsAppUrl,
} from '../utils/churchLogic';
import { PageHeader } from '../components/PageHeader';
import { SubmissionForm } from '../components/SubmissionForm';

export function ContactPage() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || '';

  const mapsUrl = buildGoogleMapsUrl(churchConfig.contact.fullAddress);
  const mapsEmbedUrl = buildGoogleMapsEmbedUrl(churchConfig.contact.fullAddress);
  const whatsAppUrl = buildWhatsAppUrl(
    churchConfig.contact.whatsappNumber,
    churchConfig.contact.whatsappPrefill,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Get In Touch"
        title="Contact Our Church Office"
        description="Have a question about Sunday services, ministries, weddings, or community programmes? Reach out by form, phone, email, or WhatsApp."
      />

      <section className="py-14 sm:py-16 border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-[#18181B]">
                Church Details
              </h2>

              <div className="space-y-4 text-sm text-[#52525B]">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="w-4 h-4 text-[#1B365D] shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-[#18181B]">Address</p>
                    <p>{churchConfig.contact.addressLine1}</p>
                    <p>{churchConfig.contact.cityStateZip}</p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#1B365D] hover:underline"
                    >
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 tabular-nums">
                  <Phone
                    className="w-4 h-4 text-[#1B365D] shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-[#18181B]">Phone</p>
                    <a
                      href={`tel:${churchConfig.contact.phone.replace(/[^\d+]/g, '')}`}
                      className="hover:text-[#1B365D]"
                    >
                      {churchConfig.contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail
                    className="w-4 h-4 text-[#1B365D] shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-[#18181B]">Email</p>
                    <a
                      href={`mailto:${churchConfig.contact.email}`}
                      className="hover:text-[#1B365D]"
                    >
                      {churchConfig.contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 tabular-nums">
                  <Clock
                    className="w-4 h-4 text-[#1B365D] shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-[#18181B]">Office Hours</p>
                    <p>{churchConfig.contact.officeHours}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E0D8] flex flex-wrap gap-3">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#14532D] rounded-lg hover:bg-[#114224] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Message on WhatsApp</span>
                </a>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-[#8B6F47]">
                  Follow:
                </span>
                {churchConfig.contact.socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#52525B] hover:text-[#1B365D] underline decoration-[#D6D0C4] underline-offset-4"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="mb-5">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Send an Enquiry
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-1">
                Write to Us
              </h2>
            </div>
            <SubmissionForm mode="contact" initialSubject={initialSubject} />
          </div>
        </div>
      </section>

      {/* Location Map Section */}
      <section className="py-14 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Location
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-1">
                Find Us on the Map
              </h2>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F2EFE9] h-[340px]">
            <iframe
              title={`Map showing ${churchConfig.identity.name} at ${churchConfig.contact.fullAddress}`}
              src={mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
