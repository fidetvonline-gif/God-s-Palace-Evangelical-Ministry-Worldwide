import { Shield } from 'lucide-react';
import { churchConfig } from '../data/churchConfig';
import { PageHeader } from '../components/PageHeader';
import { SubmissionForm } from '../components/SubmissionForm';

export function PrayerPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Prayer Ministry"
        title="Submit a Prayer Request"
        description="Whatever season you are walking through, our pastors and prayer team would be honored to bring your needs before God in prayer."
      />

      <section className="py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#F2EFE9] text-[#1B365D] flex items-center justify-center">
                <Shield className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-[#18181B]">
                Handled With Respect &amp; Privacy
              </h2>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Every prayer request submitted here is kept confidential and shared only
                with the intended prayer team or Senior Pastor according to your chosen
                preference.
              </p>
              <p className="text-sm text-[#52525B] leading-relaxed">
                You may submit a request anonymously by leaving your name and contact
                fields blank, or include your details if you would welcome pastoral
                encouragement.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#E5E0D8] bg-[#F2EFE9]/60">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Corporate Prayer &amp; Intercession
              </p>
              <p className="mt-2 font-serif text-lg font-semibold text-[#18181B]">
                {churchConfig.services.find((s) => s.id === 'prayer-service')?.name ??
                  'Weekly Corporate Prayer'}
              </p>
              <p className="mt-1 text-sm text-[#52525B] tabular-nums">
                {churchConfig.services.find((s) => s.id === 'prayer-service')?.day ??
                  'Weekly'}{' '}
                · Confirm hours via {churchConfig.contact.phone}
              </p>
              <p className="mt-1 text-sm text-[#52525B]">
                Main Sanctuary · {churchConfig.contact.fullAddress}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <SubmissionForm mode="prayer" />
          </div>
        </div>
      </section>
    </div>
  );
}
