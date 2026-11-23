import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import {
  validateSubmission,
  type PrayerPrivacyPreference,
  type SubmissionPayload,
  type SubmissionType,
} from '../utils/churchLogic';

interface SubmissionFormProps {
  mode: SubmissionType;
  initialSubject?: string;
}

interface SubmissionReceipt {
  id: string;
  message: string;
}

export function SubmissionForm({ mode, initialSubject = '' }: SubmissionFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [privacyPreference, setPrivacyPreference] =
    useState<PrayerPrivacyPreference>('prayer_team');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // Hidden honeypot

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (receipt && receiptRef.current) {
      receiptRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [receipt]);

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setVisitDate('');
    setSubject(initialSubject);
    setMessage('');
    setContactInfo('');
    setPrayerRequest('');
    setPrivacyPreference('prayer_team');
    setConsent(false);
    setWebsite('');
    setErrors({});
    setSubmitError(null);
    setReceipt(null);
  };

  const buildPayload = (): Record<string, unknown> => {
    if (mode === 'visitor') {
      return {
        type: 'visitor',
        fullName,
        phone,
        email,
        visitDate,
        message,
        consent,
        website,
      };
    }
    if (mode === 'prayer') {
      return {
        type: 'prayer',
        fullName,
        contactInfo,
        prayerRequest,
        privacyPreference,
        consent,
        website,
      };
    }
    return {
      type: 'contact',
      fullName,
      email,
      phone,
      subject,
      message,
      website,
    };
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    const rawPayload = buildPayload();
    const check = validateSubmission(rawPayload);

    if (!check.valid || !check.sanitized) {
      setErrors(check.errors);
      if (check.errors.form) {
        setSubmitError(check.errors.form);
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(check.sanitized as SubmissionPayload), website }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        id?: string;
        message?: string;
        error?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !data.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setSubmitError(
          data.error || 'We could not send your submission right now. Please try again.',
        );
        return;
      }

      setReceipt({
        id: data.id || 'RECEIVED',
        message: data.message || 'Your submission has been received.',
      });
    } catch {
      setSubmitError(
        'Network error while sending your form. Please check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div
        ref={receiptRef}
        role="status"
        aria-live="polite"
        className="scroll-mt-24 bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-8"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="w-6 h-6 text-[#14532D] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-serif text-2xl font-semibold text-[#18181B]">
              {mode === 'prayer'
                ? 'Prayer Request Received'
                : mode === 'visitor'
                  ? 'We Look Forward to Welcoming You'
                  : 'Message Sent'}
            </h3>
            <p className="mt-2 text-[#52525B] leading-relaxed">{receipt.message}</p>
            <p className="mt-3 text-xs font-medium tracking-wide uppercase text-[#8B6F47] tabular-nums">
              Reference · {receipt.id}
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-[#1B365D] border border-[#E5E0D8] rounded-lg hover:bg-[#F2EFE9] transition-colors whitespace-nowrap"
            >
              {mode === 'prayer'
                ? 'Submit Another Prayer Request'
                : mode === 'visitor'
                  ? 'Submit Another Visit Note'
                  : 'Send Another Message'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputBase =
    'w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-white border rounded-lg transition-colors placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D]';

  const fieldBorder = (name: string) =>
    errors[name] ? 'border-[#991B1B]' : 'border-[#D6D0C4]';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-8 space-y-5"
    >
      {/* Hidden anti-spam honeypot field */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${mode}-website`}>Website</label>
        <input
          id={`${mode}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      {mode === 'visitor' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="visitor-fullName"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Full Name <span className="text-[#991B1B]">*</span>
              </label>
              <input
                id="visitor-fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'visitor-fullName-err' : undefined}
                placeholder="Your full name"
                className={`${inputBase} ${fieldBorder('fullName')}`}
              />
              {errors.fullName && (
                <p id="visitor-fullName-err" className="mt-1.5 text-xs text-[#991B1B]">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="visitor-phone"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Phone Number <span className="text-[#991B1B]">*</span>
              </label>
              <input
                id="visitor-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'visitor-phone-err' : undefined}
                placeholder="+234 813 695 8098"
                className={`${inputBase} ${fieldBorder('phone')}`}
              />
              {errors.phone && (
                <p id="visitor-phone-err" className="mt-1.5 text-xs text-[#991B1B]">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="visitor-email"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Email Address <span className="text-[#71717A] font-normal">(Optional)</span>
              </label>
              <input
                id="visitor-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'visitor-email-err' : undefined}
                placeholder="you@example.com"
                className={`${inputBase} ${fieldBorder('email')}`}
              />
              {errors.email && (
                <p id="visitor-email-err" className="mt-1.5 text-xs text-[#991B1B]">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="visitor-visitDate"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Planned Date of Visit{' '}
                <span className="text-[#71717A] font-normal">(Optional)</span>
              </label>
              <input
                id="visitor-visitDate"
                name="visitDate"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className={`${inputBase} border-[#D6D0C4]`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="visitor-message"
              className="block text-sm font-medium text-[#18181B] mb-1.5"
            >
              Message or Questions{' '}
              <span className="text-[#71717A] font-normal">(Optional)</span>
            </label>
            <textarea
              id="visitor-message"
              name="message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Let us know if you are bringing children, need accessibility assistance, or have any questions."
              className={`${inputBase} border-[#D6D0C4]`}
            />
          </div>

          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="visitor-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (errors.consent) setErrors((prev) => ({ ...prev, consent: '' }));
                }}
                aria-invalid={Boolean(errors.consent)}
                className="mt-1 h-4 w-4 rounded border-[#D6D0C4] text-[#1B365D] focus:ring-[#1B365D]"
              />
              <span className="text-sm text-[#52525B] leading-snug">
                I consent to {`God's Palace Evangelical Ministry Worldwide`} contacting me to
                help welcome me for my visit. <span className="text-[#991B1B]">*</span>
              </span>
            </label>
            {errors.consent && (
              <p className="mt-1.5 text-xs text-[#991B1B]">{errors.consent}</p>
            )}
          </div>
        </>
      )}

      {mode === 'prayer' && (
        <>
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-[#F2EFE9] text-sm text-[#3F3F46]">
            <Lock className="w-4 h-4 text-[#1B365D] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Your request is treated with reverence and care. It is never published
              online and is shared only according to the privacy setting you choose below.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prayer-fullName"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Your Name <span className="text-[#71717A] font-normal">(Optional)</span>
              </label>
              <input
                id="prayer-fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="You may leave this blank"
                className={`${inputBase} border-[#D6D0C4]`}
              />
            </div>

            <div>
              <label
                htmlFor="prayer-contactInfo"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Phone or Email{' '}
                <span className="text-[#71717A] font-normal">(Optional)</span>
              </label>
              <input
                id="prayer-contactInfo"
                name="contactInfo"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Only if you'd like pastoral follow-up"
                className={`${inputBase} border-[#D6D0C4]`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="prayer-request"
              className="block text-sm font-medium text-[#18181B] mb-1.5"
            >
              Prayer Request <span className="text-[#991B1B]">*</span>
            </label>
            <textarea
              id="prayer-request"
              name="prayerRequest"
              rows={5}
              required
              value={prayerRequest}
              onChange={(e) => {
                setPrayerRequest(e.target.value);
                if (errors.prayerRequest)
                  setErrors((prev) => ({ ...prev, prayerRequest: '' }));
              }}
              aria-invalid={Boolean(errors.prayerRequest)}
              aria-describedby={errors.prayerRequest ? 'prayer-request-err' : undefined}
              placeholder="Share how our pastoral team and intercessors can pray for you today..."
              className={`${inputBase} ${fieldBorder('prayerRequest')}`}
            />
            {errors.prayerRequest && (
              <p id="prayer-request-err" className="mt-1.5 text-xs text-[#991B1B]">
                {errors.prayerRequest}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-[#18181B] mb-2">
              Privacy Preference
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  privacyPreference === 'prayer_team'
                    ? 'border-[#1B365D] bg-[#F8FAFC]'
                    : 'border-[#E5E0D8] hover:bg-[#FAF9F6]'
                }`}
              >
                <input
                  type="radio"
                  name="privacyPreference"
                  value="prayer_team"
                  checked={privacyPreference === 'prayer_team'}
                  onChange={() => setPrivacyPreference('prayer_team')}
                  className="mt-1 text-[#1B365D]"
                />
                <span className="text-sm">
                  <span className="block font-medium text-[#18181B]">
                    Share with Prayer Team
                  </span>
                  <span className="block text-xs text-[#52525B] mt-0.5">
                    Prayed over by our pastors and vetted prayer ministry team.
                  </span>
                </span>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  privacyPreference === 'senior_pastor_only'
                    ? 'border-[#1B365D] bg-[#F8FAFC]'
                    : 'border-[#E5E0D8] hover:bg-[#FAF9F6]'
                }`}
              >
                <input
                  type="radio"
                  name="privacyPreference"
                  value="senior_pastor_only"
                  checked={privacyPreference === 'senior_pastor_only'}
                  onChange={() => setPrivacyPreference('senior_pastor_only')}
                  className="mt-1 text-[#1B365D]"
                />
                <span className="text-sm">
                  <span className="block font-medium text-[#18181B]">
                    Senior Pastor Only
                  </span>
                  <span className="block text-xs text-[#52525B] mt-0.5">
                    Kept strictly confidential for pastoral prayer only.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="prayer-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (errors.consent) setErrors((prev) => ({ ...prev, consent: '' }));
                }}
                aria-invalid={Boolean(errors.consent)}
                className="mt-1 h-4 w-4 rounded border-[#D6D0C4] text-[#1B365D] focus:ring-[#1B365D]"
              />
              <span className="text-sm text-[#52525B] leading-snug">
                I consent to {`God's Palace Evangelical Ministry Worldwide`} receiving and
                praying over this request according to my selected privacy preference.{' '}
                <span className="text-[#991B1B]">*</span>
              </span>
            </label>
            {errors.consent && (
              <p className="mt-1.5 text-xs text-[#991B1B]">{errors.consent}</p>
            )}
          </div>
        </>
      )}

      {mode === 'contact' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contact-fullName"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Full Name <span className="text-[#991B1B]">*</span>
              </label>
              <input
                id="contact-fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'contact-fullName-err' : undefined}
                placeholder="Your full name"
                className={`${inputBase} ${fieldBorder('fullName')}`}
              />
              {errors.fullName && (
                <p id="contact-fullName-err" className="mt-1.5 text-xs text-[#991B1B]">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Email Address <span className="text-[#991B1B]">*</span>
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'contact-email-err' : undefined}
                placeholder="you@example.com"
                className={`${inputBase} ${fieldBorder('email')}`}
              />
              {errors.email && (
                <p id="contact-email-err" className="mt-1.5 text-xs text-[#991B1B]">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contact-phone"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Phone Number{' '}
                <span className="text-[#71717A] font-normal">(Optional)</span>
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'contact-phone-err' : undefined}
                placeholder="+234 813 695 8098"
                className={`${inputBase} ${fieldBorder('phone')}`}
              />
              {errors.phone && (
                <p id="contact-phone-err" className="mt-1.5 text-xs text-[#991B1B]">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="contact-subject"
                className="block text-sm font-medium text-[#18181B] mb-1.5"
              >
                Subject <span className="text-[#991B1B]">*</span>
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                required
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
                }}
                aria-invalid={Boolean(errors.subject)}
                aria-describedby={errors.subject ? 'contact-subject-err' : undefined}
                placeholder="General enquiry, ministry question..."
                className={`${inputBase} ${fieldBorder('subject')}`}
              />
              {errors.subject && (
                <p id="contact-subject-err" className="mt-1.5 text-xs text-[#991B1B]">
                  {errors.subject}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="block text-sm font-medium text-[#18181B] mb-1.5"
            >
              Message <span className="text-[#991B1B]">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              required
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
              }}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'contact-message-err' : undefined}
              placeholder="How can our church office help you?"
              className={`${inputBase} ${fieldBorder('message')}`}
            />
            {errors.message && (
              <p id="contact-message-err" className="mt-1.5 text-xs text-[#991B1B]">
                {errors.message}
              </p>
            )}
          </div>
        </>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isSubmitting && (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          )}
          <span>
            {isSubmitting
              ? 'Sending...'
              : mode === 'visitor'
                ? 'Submit Visit Details'
                : mode === 'prayer'
                  ? 'Send Prayer Request'
                  : 'Send Message'}
          </span>
        </button>
      </div>
    </form>
  );
}
