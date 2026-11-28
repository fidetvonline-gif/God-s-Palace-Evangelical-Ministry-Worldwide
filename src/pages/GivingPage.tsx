import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Landmark,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import { churchConfig } from '../data/churchConfig';
import { buildWhatsAppUrl } from '../utils/churchLogic';
import {
  buildTransferNarration,
  CURRENCY_META,
  formatGivingAmount,
  getDefaultGivingConfig,
  getGivingCategory,
  GIVING_CATEGORIES,
  validateGivingSubmission,
  type GivingCategoryId,
  type GivingConfig,
  type GivingCurrency,
  type GivingFrequency,
} from '../utils/givingLogic';
import { PageHeader } from '../components/PageHeader';
import { ResilientImage } from '../components/ResilientImage';

interface GivingReceipt {
  id: string;
  submittedAt: string;
  narration: string;
  category: GivingCategoryId;
  amount: number;
  currency: GivingCurrency;
  frequency: GivingFrequency;
  giverName?: string;
  giverEmail?: string;
  emailDelivered?: boolean;
  notificationEmail?: string;
  message: string;
}

export function GivingPage() {
  const [config, setConfig] = useState<GivingConfig>(getDefaultGivingConfig());
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Account Details Popup Modal (triggered when donor enters name/email/amount and clicks to donate)
  const [showAccountPopup, setShowAccountPopup] = useState(false);

  // Donor Flow: Step 1 (Purpose, Amount, Real Name & Email) -> Popup Account Details -> Confirm & WhatsApp
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<GivingCategoryId>('tithe');
  const [currency, setCurrency] = useState<GivingCurrency>('NGN');
  const [frequency, setFrequency] = useState<GivingFrequency>('one_time');
  const [amountInput, setAmountInput] = useState<string>('5000');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [giverName, setGiverName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [prayerNote, setPrayerNote] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [website, setWebsite] = useState(''); // Honeypot

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<GivingReceipt | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/giving-config')
      .then((r) => r.json())
      .then((cfgRes) => {
        if (!active) return;
        if (cfgRes?.ok && cfgRes.config) {
          setConfig(cfgRes.config);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingConfig(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (receipt && receiptRef.current) {
      receiptRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [receipt]);

  useEffect(() => {
    if (!showAccountPopup) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAccountPopup(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAccountPopup]);

  const handleCopy = async (key: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2400);
    } catch {
      // Clipboard fallback unavailable
    }
  };

  const parsedAmount = Number(amountInput.replace(/,/g, '').trim());
  const selectedCategory = getGivingCategory(category);
  const narrationPreview = buildTransferNarration(category, giverName, isAnonymous);

  const validateDonorStepOne = (): boolean => {
    const errors: Record<string, string> = {};
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100_000_000) {
      errors.amount = 'Please enter a valid giving amount greater than zero.';
    }
    if (!isAnonymous) {
      if (giverName.trim().length < 2) {
        errors.giverName = 'Please enter your full name.';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
        errors.email = 'Please enter your email address.';
      }
    } else if (
      email.trim().length > 0 &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
    ) {
      errors.email = 'Please enter a valid email address or leave it blank.';
    }
    if (phone.trim().length > 0 && !/^[+\d\s().-]{7,20}$/.test(phone.trim())) {
      errors.phone = 'Please enter a valid phone number or leave it blank.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToDonate = () => {
    if (!validateDonorStepOne()) return;
    setStep(2);
    setShowAccountPopup(true);
  };

  const submitGivingConfirmation = async (forceConfirmed = false) => {
    if (isSubmitting) return;
    setSubmitError(null);

    const payload = {
      category,
      amount: parsedAmount,
      currency,
      frequency,
      isAnonymous,
      giverName,
      phone,
      email,
      transferReference,
      prayerNote,
      transferConfirmed: forceConfirmed ? true : transferConfirmed,
      website,
    };

    const check = validateGivingSubmission(payload);
    if (!check.valid || !check.sanitized) {
      setFormErrors(check.errors);
      if (check.errors.amount || check.errors.giverName || check.errors.phone || check.errors.email) {
        setStep(1);
        setShowAccountPopup(false);
      }
      if (check.errors.form) {
        setSubmitError(check.errors.form);
      }
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/givings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...check.sanitized, website }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.errors) setFormErrors(data.errors);
        setSubmitError(data.error || 'Could not record your giving confirmation right now.');
        return;
      }

      setShowAccountPopup(false);
      setReceipt({
        id: data.id,
        submittedAt: data.submittedAt,
        narration: data.narration || narrationPreview,
        category: check.sanitized.category,
        amount: check.sanitized.amount,
        currency: check.sanitized.currency,
        frequency: check.sanitized.frequency,
        giverName: check.sanitized.giverName,
        giverEmail: check.sanitized.email,
        emailDelivered: Boolean(data.emailDelivered),
        notificationEmail: data.notificationEmail || churchConfig.contact.email,
        message: data.message,
      });
    } catch {
      setSubmitError('We are having trouble connecting. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitGiving = async (e: FormEvent) => {
    e.preventDefault();
    await submitGivingConfirmation(false);
  };

  const resetGivingFlow = () => {
    setReceipt(null);
    setStep(1);
    setShowAccountPopup(false);
    setTransferReference('');
    setTransferConfirmed(false);
    setPrayerNote('');
    setFormErrors({});
    setSubmitError(null);
  };

  const primaryAcc = config.primaryAccount;
  const fullCopyText = [
    `Bank: ${primaryAcc.bankName}`,
    `Account Name: ${primaryAcc.accountName}`,
    `Account Number: ${primaryAcc.accountNumber}`,
    `Narration: ${narrationPreview}`,
  ].join('\n');

  const whatsAppConfirmHref = receipt
    ? buildWhatsAppUrl(
        churchConfig.contact.whatsappNumber,
        `Hello God's Palace Evangelical Ministry Worldwide (GPEMWW), I have just transferred my ${getGivingCategory(receipt.category).label} of ${formatGivingAmount(receipt.amount, receipt.currency)} to ${primaryAcc.bankName} (${primaryAcc.accountNumber}). Name: ${receipt.giverName || 'Anonymous'}. Reference: ${receipt.id}.`,
      )
    : buildWhatsAppUrl(
        churchConfig.contact.whatsappNumber,
        `Hello God's Palace Evangelical Ministry Worldwide (GPEMWW), I have just sent my ${selectedCategory.label} of ${formatGivingAmount(parsedAmount, currency)} to ${primaryAcc.bankName} (${primaryAcc.accountNumber}). Name: ${isAnonymous ? 'Anonymous' : giverName || 'Member'}.`,
      );

  const receiptMailHref = receipt
    ? `mailto:${encodeURIComponent(receipt.notificationEmail || churchConfig.contact.email)}?subject=${encodeURIComponent(
        `[Giving Confirmation] ${getGivingCategory(receipt.category).label} · ${formatGivingAmount(receipt.amount, receipt.currency)} (${receipt.id})`,
      )}&body=${encodeURIComponent(
        `Giving Purpose: ${getGivingCategory(receipt.category).label}\nAmount: ${formatGivingAmount(receipt.amount, receipt.currency)}\nDonor: ${receipt.giverName || 'Anonymous'}\nEmail: ${receipt.giverEmail || 'Not provided'}\nReference: ${receipt.id}\nTransfer Narration: ${receipt.narration}\nBank: ${primaryAcc.bankName} (${primaryAcc.accountNumber})`,
      )}`
    : undefined;

  const inputBase =
    'w-full px-3.5 py-2.5 text-sm text-[#18181B] bg-white border rounded-lg transition-colors placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D]';

  return (
    <div>
      <PageHeader
        eyebrow={churchConfig.giving.eyebrow}
        title={churchConfig.giving.headline}
        description={churchConfig.giving.description}
      />

      {/* POPUP MODAL: Official Church Bank Account Details & WhatsApp Contact */}
      {showAccountPopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-account-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#E5E0D8] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#8B6F47]">
                  Transfer Destination · {selectedCategory.label}
                </p>
                <h2
                  id="popup-account-title"
                  className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]"
                >
                  Official Church Account Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountPopup(false)}
                aria-label="Close account details popup"
                className="w-9 h-9 rounded-lg border border-[#E5E0D8] bg-white text-[#52525B] hover:text-[#18181B] hover:bg-[#F2EFE9] inline-flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
                <span className="text-sm text-[#52525B]">Amount to Transfer</span>
                <span className="font-mono text-xl font-semibold text-[#1B365D] tabular-nums">
                  {formatGivingAmount(parsedAmount, currency)}
                </span>
              </div>

              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#52525B]">Bank Name</dt>
                  <dd className="font-semibold text-[#18181B]">{primaryAcc.bankName}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#52525B]">Account Name</dt>
                  <dd className="font-semibold text-[#18181B] text-right">
                    {primaryAcc.accountName}
                  </dd>
                </div>
              </dl>

              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E0D8]">
                <p className="text-xs font-medium uppercase tracking-wider text-[#8B6F47]">
                  Account Number
                </p>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-xl sm:text-3xl font-semibold tracking-wider text-[#1B365D] tabular-nums">
                    {primaryAcc.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('popup-acc-num', primaryAcc.accountNumber)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedKey === 'popup-acc-num' ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F2EFE9]/60 border border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-[#52525B]">Suggested Narration</p>
                  <p className="font-mono text-xs sm:text-sm font-semibold text-[#18181B]">
                    {narrationPreview}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('popup-narration', narrationPreview)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1B365D] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9]"
                >
                  {copiedKey === 'popup-narration' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-4 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#14532D]">
                  After Sending Money · Confirm via WhatsApp
                </p>
                <p className="text-xs text-[#3F3F46] leading-relaxed">
                  Once your transfer is sent, message our church office on WhatsApp at{' '}
                  <strong className="font-semibold text-[#18181B] tabular-nums">
                    {churchConfig.contact.phone}
                  </strong>{' '}
                  or click confirm below so we can acknowledge your gift.
                </p>
                <a
                  href={whatsAppConfirmHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] hover:underline"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Chat on WhatsApp ({churchConfig.contact.phone})</span>
                </a>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setTransferConfirmed(true);
                    void submitGivingConfirmation(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] disabled:opacity-60 transition-colors whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>I Have Sent the Money — Confirm</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAccountPopup(false)}
                  className="px-4 py-3 text-sm font-medium text-[#52525B] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors whitespace-nowrap"
                >
                  Add Transfer Ref
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT COLUMN: Display Picture, Official Church Account & Finance Office */}
          <div className="lg:col-span-5 space-y-6">
            {/* Featured Display Picture */}
            <figure className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden">
                <ResilientImage
                  src={churchConfig.giving.displayImage}
                  alt={churchConfig.giving.displayCaption}
                  className="w-full h-full object-cover object-center"
                  containerClassName="w-full h-full"
                  fallbackTitle={churchConfig.identity.name}
                />
              </div>
              <figcaption className="px-5 py-3 text-xs text-[#52525B] border-t border-[#E5E0D8]">
                {churchConfig.giving.displayCaption}
              </figcaption>
            </figure>

            {/* Official Church Bank Account Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF9F6] flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B365D] text-white flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#8B6F47]">
                    Direct Bank Transfer
                  </p>
                  <h2 className="font-serif text-xl font-semibold text-[#18181B]">
                    Official Church Account
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {loadingConfig ? (
                  <div className="py-4 text-sm text-[#52525B] flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1B365D]" aria-hidden="true" />
                    <span>Loading church account details...</span>
                  </div>
                ) : (
                  <>
                    <dl className="divide-y divide-[#E5E0D8] border-y border-[#E5E0D8] text-sm">
                      <div className="py-3 flex items-center justify-between gap-4">
                        <dt className="text-[#52525B]">Bank Name</dt>
                        <dd className="font-semibold text-[#18181B] text-right">
                          {primaryAcc.bankName}
                        </dd>
                      </div>
                      <div className="py-3 flex items-center justify-between gap-4">
                        <dt className="text-[#52525B]">Account Name</dt>
                        <dd className="font-semibold text-[#18181B] text-right">
                          {primaryAcc.accountName}
                        </dd>
                      </div>
                      {primaryAcc.routingOrSwift && (
                        <div className="py-3 flex items-center justify-between gap-4">
                          <dt className="text-[#52525B]">SWIFT / Sort Code</dt>
                          <dd className="font-mono text-xs font-medium text-[#18181B] tabular-nums">
                            {primaryAcc.routingOrSwift}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E5E0D8]">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#8B6F47]">
                        Account Number
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
                        <span
                          data-testid="primary-account-number"
                          className="font-mono text-xl sm:text-3xl font-semibold tracking-wider text-[#1B365D] tabular-nums"
                        >
                          {primaryAcc.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('primary-num', primaryAcc.accountNumber)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap shrink-0"
                        >
                          {copiedKey === 'primary-num' ? (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Copy Number</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy('full-details', fullCopyText)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1B365D] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors whitespace-nowrap"
                    >
                      {copiedKey === 'full-details' ? (
                        <>
                          <Check className="w-4 h-4 text-[#14532D]" aria-hidden="true" />
                          <span>Full Transfer Details Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" aria-hidden="true" />
                          <span>Copy All Bank Details &amp; Narration</span>
                        </>
                      )}
                    </button>

                    {config.secondaryAccount && (
                      <div className="pt-4 border-t border-[#E5E0D8] space-y-2.5">
                        <p className="text-xs font-medium uppercase tracking-wider text-[#8B6F47]">
                          {config.secondaryAccount.label}
                        </p>
                        <div className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#E5E0D8] flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-[#52525B]">
                              {config.secondaryAccount.bankName} &middot;{' '}
                              {config.secondaryAccount.accountName}
                            </p>
                            <p className="font-mono text-base font-semibold text-[#18181B] tabular-nums mt-0.5">
                              {config.secondaryAccount.accountNumber}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy('sec-num', config.secondaryAccount?.accountNumber || '')
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1B365D] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] whitespace-nowrap shrink-0"
                          >
                            {copiedKey === 'sec-num' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#14532D]" aria-hidden="true" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-[#52525B] leading-relaxed">
                      {config.transferInstructions}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Scripture, Email & WhatsApp Confirmation Card */}
            <div className="p-6 rounded-xl border border-[#E5E0D8] bg-[#F2EFE9]/60 space-y-4">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                Word on Stewardship
              </p>
              <blockquote className="py-3 border-y border-[#E5E0D8]">
                <p className="font-serif italic text-base text-[#18181B] leading-relaxed">
                  &ldquo;{churchConfig.giving.scriptureQuote}&rdquo;
                </p>
                <footer className="mt-1.5 text-xs font-medium text-[#8B6F47]">
                  {churchConfig.giving.scriptureReference}
                </footer>
              </blockquote>
              <div className="text-xs sm:text-sm text-[#52525B] space-y-2.5">
                <p>After transferring, contact our church office to confirm:</p>
                <div className="flex flex-col gap-2">
                  <a
                    href={whatsAppConfirmHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[#14532D] hover:underline"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">WhatsApp: {churchConfig.contact.phone}</span>
                  </a>
                  <a
                    href={`mailto:${churchConfig.contact.email}`}
                    className="inline-flex items-center gap-1.5 font-medium text-[#1B365D] hover:underline"
                  >
                    <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Email: {churchConfig.contact.email}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Donation Form (Name, Email, Purpose, Amount -> Popup Account Details -> WhatsApp Confirmation) */}
          <div className="lg:col-span-7">
            {receipt ? (
              <div
                ref={receiptRef}
                role="status"
                aria-live="polite"
                className="scroll-mt-24 bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-start gap-3.5">
                  <CheckCircle2
                    className="w-7 h-7 text-[#14532D] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                      Giving Confirmation Receipt
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] mt-1">
                      God Bless You for Your Faithfulness
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-[#52525B] leading-relaxed">
                      {receipt.message}
                      {receipt.emailDelivered && receipt.notificationEmail
                        ? ` Forwarded directly to ${receipt.notificationEmail}.`
                        : ''}
                    </p>
                  </div>
                </div>

                <dl className="divide-y divide-[#E5E0D8] border-y border-[#E5E0D8] text-sm">
                  <div className="py-3 flex items-center justify-between gap-4">
                    <dt className="text-[#52525B]">Reference Number</dt>
                    <dd className="font-mono font-semibold text-[#1B365D] tabular-nums">
                      {receipt.id}
                    </dd>
                  </div>
                  <div className="py-3 flex items-center justify-between gap-4">
                    <dt className="text-[#52525B]">Giving Purpose</dt>
                    <dd className="font-medium text-[#18181B]">
                      {getGivingCategory(receipt.category).label} (
                      {receipt.frequency === 'monthly' ? 'Monthly Covenant' : 'One-Time'})
                    </dd>
                  </div>
                  <div className="py-3 flex items-center justify-between gap-4">
                    <dt className="text-[#52525B]">Amount</dt>
                    <dd className="font-mono text-lg font-semibold text-[#18181B] tabular-nums">
                      {formatGivingAmount(receipt.amount, receipt.currency)}
                    </dd>
                  </div>
                  <div className="py-3 flex items-center justify-between gap-4">
                    <dt className="text-[#52525B]">Donor</dt>
                    <dd className="text-[#18181B]">{receipt.giverName || 'Anonymous'}</dd>
                  </div>
                  <div className="py-3 flex items-center justify-between gap-4">
                    <dt className="text-[#52525B]">Bank Account Used</dt>
                    <dd className="font-mono text-xs text-[#18181B] tabular-nums">
                      {primaryAcc.bankName} · {primaryAcc.accountNumber}
                    </dd>
                  </div>
                  <div className="py-3 flex items-center justify-between gap-4">
                    <dt className="text-[#52525B]">Transfer Narration</dt>
                    <dd className="font-mono text-xs text-[#18181B]">{receipt.narration}</dd>
                  </div>
                </dl>

                {/* Prominent WhatsApp Confirmation Callout After Sending */}
                <div className="p-5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[#14532D]">
                        Send Transfer Alert via WhatsApp
                      </h3>
                      <p className="text-xs sm:text-sm text-[#3F3F46] mt-1 leading-relaxed">
                        Message or call our church WhatsApp line at{' '}
                        <strong className="font-semibold text-[#18181B] tabular-nums">
                          {churchConfig.contact.phone}
                        </strong>{' '}
                        to notify our finance team of your transfer.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={whatsAppConfirmHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#14532D] rounded-lg hover:bg-[#0F3F22] transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Message {churchConfig.contact.phone} on WhatsApp</span>
                    </a>
                    {!receipt.emailDelivered && receiptMailHref && (
                      <a
                        href={receiptMailHref}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#1B365D] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#FAF9F6] transition-colors whitespace-nowrap"
                      >
                        <Mail className="w-4 h-4" aria-hidden="true" />
                        <span>Email Copy to {churchConfig.contact.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#18181B] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors whitespace-nowrap"
                  >
                    <Printer className="w-4 h-4" aria-hidden="true" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetGivingFlow}
                    className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap"
                  >
                    Give Another Tithe or Offering
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
                {/* Step Progress Bar */}
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 p-1 bg-[#F2EFE9] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        step === 1
                          ? 'bg-white text-[#1B365D] shadow-sm'
                          : 'text-[#52525B] hover:text-[#18181B]'
                      }`}
                    >
                      1. Details &amp; Amount
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToDonate}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        step === 2
                          ? 'bg-white text-[#1B365D] shadow-sm'
                          : 'text-[#52525B] hover:text-[#18181B]'
                      }`}
                    >
                      2. Transfer &amp; Confirm
                    </button>
                  </div>
                  <span className="text-xs text-[#71717A] tabular-nums">Step {step} of 2</span>
                </div>

                <form onSubmit={handleSubmitGiving} noValidate className="p-6 sm:p-8 space-y-6">
                  {/* Hidden anti-spam honeypot */}
                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="giving-website">Website</label>
                    <input
                      id="giving-website"
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

                  {/* STEP 1: Giving Type, Amount, Real Name & Email */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                          Step 1 · Tithe, Offering &amp; Donor Details
                        </p>
                        <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-1">
                          Enter Your Giving Details
                        </h2>
                        <p className="mt-1.5 text-sm text-[#52525B]">
                          Choose what you are giving toward and enter your name and email to reveal
                          the church transfer account popup.
                        </p>
                      </div>

                      {/* Giving Type Grid */}
                      <div>
                        <span className="block text-sm font-medium text-[#18181B] mb-2">
                          What Are You Giving Toward?
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {GIVING_CATEGORIES.map((item) => {
                            const selected = category === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setCategory(item.id)}
                                className={`text-left p-3.5 rounded-xl border transition-colors ${
                                  selected
                                    ? 'border-[#1B365D] bg-[#F8FAFC] ring-1 ring-[#1B365D]'
                                    : 'border-[#E5E0D8] bg-white hover:bg-[#FAF9F6]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-serif text-base font-semibold text-[#18181B]">
                                    {item.label}
                                  </span>
                                  {selected && (
                                    <Check
                                      className="w-4 h-4 text-[#1B365D] shrink-0"
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-[#52525B] leading-relaxed">
                                  {item.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Currency & Frequency */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="giving-currency"
                            className="block text-sm font-medium text-[#18181B] mb-1.5"
                          >
                            Currency
                          </label>
                          <select
                            id="giving-currency"
                            value={currency}
                            onChange={(e) => {
                              const next = e.target.value as GivingCurrency;
                              setCurrency(next);
                              setAmountInput(String(CURRENCY_META[next].presets[2]));
                            }}
                            className={`${inputBase} border-[#D6D0C4]`}
                          >
                            {Object.values(CURRENCY_META).map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <span className="block text-sm font-medium text-[#18181B] mb-1.5">
                            Frequency
                          </span>
                          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F2EFE9] rounded-lg">
                            <button
                              type="button"
                              onClick={() => setFrequency('one_time')}
                              className={`py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                                frequency === 'one_time'
                                  ? 'bg-white text-[#1B365D] shadow-sm'
                                  : 'text-[#52525B] hover:text-[#18181B]'
                              }`}
                            >
                              One-Time
                            </button>
                            <button
                              type="button"
                              onClick={() => setFrequency('monthly')}
                              className={`py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                                frequency === 'monthly'
                                  ? 'bg-white text-[#1B365D] shadow-sm'
                                  : 'text-[#52525B] hover:text-[#18181B]'
                              }`}
                            >
                              Monthly
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div>
                        <label
                          htmlFor="giving-amount"
                          className="block text-sm font-medium text-[#18181B] mb-2"
                        >
                          Amount ({CURRENCY_META[currency].symbol}) *
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                          {CURRENCY_META[currency].presets.map((preset) => {
                            const active = parsedAmount === preset;
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setAmountInput(String(preset));
                                  if (formErrors.amount) {
                                    setFormErrors((prev) => ({ ...prev, amount: '' }));
                                  }
                                }}
                                className={`py-2 px-2 text-xs font-medium rounded-lg border tabular-nums transition-colors whitespace-nowrap ${
                                  active
                                    ? 'bg-[#1B365D] text-white border-[#1B365D]'
                                    : 'bg-[#FAF9F6] text-[#18181B] border-[#E5E0D8] hover:bg-[#F2EFE9]'
                                }`}
                              >
                                {formatGivingAmount(preset, currency)}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          id="giving-amount"
                          type="number"
                          min="1"
                          step="any"
                          required
                          value={amountInput}
                          onChange={(e) => {
                            setAmountInput(e.target.value);
                            if (formErrors.amount) {
                              setFormErrors((prev) => ({ ...prev, amount: '' }));
                            }
                          }}
                          aria-invalid={Boolean(formErrors.amount)}
                          placeholder="Enter amount"
                          className={`${inputBase} font-mono text-base tabular-nums ${
                            formErrors.amount ? 'border-[#991B1B]' : 'border-[#D6D0C4]'
                          }`}
                        />
                        {formErrors.amount && (
                          <p className="mt-1.5 text-xs text-[#991B1B]">{formErrors.amount}</p>
                        )}
                      </div>

                      {/* Real Name & Email */}
                      <div className="pt-2 border-t border-[#E5E0D8] space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-[#18181B]">
                            Your Name &amp; Contact Information
                          </h3>
                          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#52525B]">
                            <input
                              type="checkbox"
                              checked={isAnonymous}
                              onChange={(e) => {
                                setIsAnonymous(e.target.checked);
                                setFormErrors((prev) => ({
                                  ...prev,
                                  giverName: '',
                                  email: '',
                                }));
                              }}
                              className="h-4 w-4 rounded border-[#D6D0C4] text-[#1B365D]"
                            />
                            <span>Give anonymously</span>
                          </label>
                        </div>

                        {!isAnonymous && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="giving-name"
                                className="block text-sm font-medium text-[#18181B] mb-1.5"
                              >
                                Full Name <span className="text-[#991B1B]">*</span>
                              </label>
                              <input
                                id="giving-name"
                                type="text"
                                required
                                autoComplete="name"
                                value={giverName}
                                onChange={(e) => {
                                  setGiverName(e.target.value);
                                  if (formErrors.giverName) {
                                    setFormErrors((prev) => ({ ...prev, giverName: '' }));
                                  }
                                }}
                                aria-invalid={Boolean(formErrors.giverName)}
                                placeholder="Enter your real full name"
                                className={`${inputBase} ${
                                  formErrors.giverName ? 'border-[#991B1B]' : 'border-[#D6D0C4]'
                                }`}
                              />
                              {formErrors.giverName && (
                                <p className="mt-1.5 text-xs text-[#991B1B]">
                                  {formErrors.giverName}
                                </p>
                              )}
                            </div>

                            <div>
                              <label
                                htmlFor="giving-email"
                                className="block text-sm font-medium text-[#18181B] mb-1.5"
                              >
                                Email Address <span className="text-[#991B1B]">*</span>
                              </label>
                              <input
                                id="giving-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  if (formErrors.email) {
                                    setFormErrors((prev) => ({ ...prev, email: '' }));
                                  }
                                }}
                                aria-invalid={Boolean(formErrors.email)}
                                placeholder="you@example.com"
                                className={`${inputBase} ${
                                  formErrors.email ? 'border-[#991B1B]' : 'border-[#D6D0C4]'
                                }`}
                              />
                              {formErrors.email && (
                                <p className="mt-1.5 text-xs text-[#991B1B]">{formErrors.email}</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="giving-phone"
                              className="block text-sm font-medium text-[#18181B] mb-1.5"
                            >
                              Phone / WhatsApp{' '}
                              <span className="text-[#71717A] font-normal">(Optional)</span>
                            </label>
                            <input
                              id="giving-phone"
                              type="tel"
                              autoComplete="tel"
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value);
                                if (formErrors.phone) {
                                  setFormErrors((prev) => ({ ...prev, phone: '' }));
                                }
                              }}
                              placeholder="+234 813 695 8098"
                              className={`${inputBase} ${
                                formErrors.phone ? 'border-[#991B1B]' : 'border-[#D6D0C4]'
                              }`}
                            />
                            {formErrors.phone && (
                              <p className="mt-1.5 text-xs text-[#991B1B]">{formErrors.phone}</p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="giving-prayer-note"
                              className="block text-sm font-medium text-[#18181B] mb-1.5"
                            >
                              Prayer / Dedication Note{' '}
                              <span className="text-[#71717A] font-normal">(Optional)</span>
                            </label>
                            <input
                              id="giving-prayer-note"
                              type="text"
                              value={prayerNote}
                              onChange={(e) => setPrayerNote(e.target.value)}
                              placeholder="Short prayer or thanksgiving note"
                              className={`${inputBase} border-[#D6D0C4]`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleProceedToDonate}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap"
                        >
                          <span>Donate &amp; View Account Details</span>
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Transfer & Confirm */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                            Step 2 · Complete Bank Transfer
                          </p>
                          <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-1">
                            Transfer &amp; Confirm Your {selectedCategory.label}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAccountPopup(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1B365D] bg-[#FAF9F6] border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] whitespace-nowrap"
                        >
                          <Landmark className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Pop Up Account Details</span>
                        </button>
                      </div>

                      <div className="p-5 rounded-xl bg-[#FAF9F6] border border-[#E5E0D8] space-y-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-[#E5E0D8]">
                          <div>
                            <p className="text-xs text-[#52525B]">
                              {selectedCategory.label} &middot;{' '}
                              {frequency === 'monthly' ? 'Monthly Covenant' : 'One-Time'}
                            </p>
                            <p className="font-mono text-2xl font-semibold text-[#1B365D] tabular-nums mt-0.5">
                              {formatGivingAmount(parsedAmount, currency)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs font-medium text-[#1B365D] hover:underline"
                          >
                            Edit Details
                          </button>
                        </div>

                        <div className="space-y-2.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#52525B] flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-[#1B365D]" aria-hidden="true" />
                              <span>Bank Name:</span>
                            </span>
                            <span className="font-semibold text-[#18181B]">
                              {primaryAcc.bankName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#52525B]">Account Name:</span>
                            <span className="font-medium text-[#18181B] text-right">
                              {primaryAcc.accountName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[#52525B]">Account Number:</span>
                            <span className="inline-flex items-center gap-2">
                              <span className="font-mono text-base font-semibold text-[#1B365D] tabular-nums">
                                {primaryAcc.accountNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy('step2-acc', primaryAcc.accountNumber)}
                                className="px-2.5 py-1 text-xs font-medium text-[#1B365D] bg-white border border-[#D6D0C4] rounded-md hover:bg-[#F2EFE9]"
                              >
                                {copiedKey === 'step2-acc' ? 'Copied' : 'Copy'}
                              </button>
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs text-[#52525B]">Recommended Bank Narration</p>
                            <p className="font-mono text-xs sm:text-sm font-semibold text-[#18181B] mt-0.5">
                              {narrationPreview}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy('narration', narrationPreview)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1B365D] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] whitespace-nowrap"
                          >
                            {copiedKey === 'narration' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#14532D]" aria-hidden="true" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Copy Narration</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-[#3F3F46]">
                          <p className="font-semibold text-[#14532D]">
                            WhatsApp Confirmation Line
                          </p>
                          <p className="mt-0.5 tabular-nums">
                            After transferring, contact{' '}
                            <strong className="text-[#18181B]">{churchConfig.contact.phone}</strong>{' '}
                            on WhatsApp.
                          </p>
                        </div>
                        <a
                          href={whatsAppConfirmHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#14532D] rounded-lg hover:bg-[#0F3F22] whitespace-nowrap"
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>WhatsApp Office</span>
                        </a>
                      </div>

                      <div>
                        <label
                          htmlFor="giving-transfer-ref"
                          className="block text-sm font-medium text-[#18181B] mb-1.5"
                        >
                          Sender Bank or Transfer Reference{' '}
                          <span className="text-[#71717A] font-normal">(Optional)</span>
                        </label>
                        <input
                          id="giving-transfer-ref"
                          type="text"
                          value={transferReference}
                          onChange={(e) => setTransferReference(e.target.value)}
                          placeholder="e.g., Zenith / GTBank Session ID"
                          className={`${inputBase} border-[#D6D0C4]`}
                        />
                      </div>

                      <div>
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            id="giving-confirmed-checkbox"
                            type="checkbox"
                            checked={transferConfirmed}
                            onChange={(e) => {
                              setTransferConfirmed(e.target.checked);
                              if (formErrors.transferConfirmed) {
                                setFormErrors((prev) => ({ ...prev, transferConfirmed: '' }));
                              }
                            }}
                            aria-invalid={Boolean(formErrors.transferConfirmed)}
                            className="mt-1 h-4 w-4 rounded border-[#D6D0C4] text-[#1B365D] focus:ring-[#1B365D]"
                          />
                          <span className="text-sm text-[#3F3F46] leading-snug">
                            I have completed this bank transfer for{' '}
                            <strong className="font-semibold text-[#18181B] tabular-nums">
                              {formatGivingAmount(parsedAmount, currency)}
                            </strong>{' '}
                            to {primaryAcc.bankName} ({primaryAcc.accountNumber}).{' '}
                            <span className="text-[#991B1B]">*</span>
                          </span>
                        </label>
                        {formErrors.transferConfirmed && (
                          <p className="mt-1.5 text-xs text-[#991B1B]">
                            {formErrors.transferConfirmed}
                          </p>
                        )}
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#F2EFE9]/60 flex items-start gap-2.5 text-xs text-[#52525B]">
                        <ShieldCheck
                          className="w-4 h-4 text-[#1B365D] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          Your giving record is kept private for church stewardship acknowledgement
                          and sent directly to {churchConfig.contact.email}.
                        </span>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="px-4 py-2.5 text-sm font-medium text-[#52525B] border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors whitespace-nowrap"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] disabled:opacity-60 transition-colors whitespace-nowrap"
                        >
                          {isSubmitting && (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          )}
                          <span>
                            {isSubmitting
                              ? 'Confirming Giving...'
                              : `Confirm ${selectedCategory.label} Transfer`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
