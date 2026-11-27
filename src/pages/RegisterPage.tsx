import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ClipboardCopy,
  ExternalLink,
  FileText,
  RotateCcw,
  Settings2,
  UserPlus,
} from 'lucide-react';
import { churchConfig } from '../data/churchConfig';
import {
  buildGoogleFormTemplateChecklist,
  getDefaultMemberFormConfig,
  MEMBER_REGISTRATION_FIELDS,
  parseGoogleFormUrl,
  type MemberFormConfig,
} from '../utils/memberFormLogic';
import { buildWhatsAppUrl } from '../utils/churchLogic';
import { PageHeader } from '../components/PageHeader';

const SECTIONS: Array<'Contact Information' | 'Personal & Household' | 'Church & Ministry Details'> = [
  'Contact Information',
  'Personal & Household',
  'Church & Ministry Details',
];

export function RegisterPage() {
  const defaultConfig = getDefaultMemberFormConfig();
  const [config, setConfig] = useState<MemberFormConfig>(defaultConfig);
  const [showAdminSetup, setShowAdminSetup] = useState(false);

  const [formUrlInput, setFormUrlInput] = useState(defaultConfig.viewUrl);
  const [formTitleInput, setFormTitleInput] = useState(defaultConfig.formTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/member-form')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.ok && data.config && parseGoogleFormUrl(data.config.embedUrl).valid) {
          setConfig(data.config);
          setFormUrlInput(data.config.viewUrl || defaultConfig.viewUrl);
          setFormTitleInput(
            data.config.formTitle || defaultConfig.formTitle,
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [defaultConfig.formTitle, defaultConfig.viewUrl]);

  const handleConnectForm = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveNotice(null);

    const check = parseGoogleFormUrl(formUrlInput);
    if (!check.valid) {
      setError(check.error || 'Please enter a valid Google Form URL.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/member-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formUrl: formUrlInput.trim(),
          formTitle: formTitleInput.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Could not save Google Form link.');
      }
      setConfig(data.config);
      setFormUrlInput(data.config.viewUrl);
      setShowAdminSetup(false);
      setSaveNotice('Your church member Google Form is now live on this page.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save Google Form link.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaultForm = async () => {
    setSaving(true);
    setError(null);
    setSaveNotice(null);
    try {
      const response = await fetch('/api/member-form', { method: 'DELETE' });
      const data = await response.json().catch(() => null);
      const restored = data?.config ?? getDefaultMemberFormConfig();
      setConfig(restored);
      setFormUrlInput(restored.viewUrl);
      setFormTitleInput(restored.formTitle);
      setShowAdminSetup(false);
      setSaveNotice('Restored the official church Google Form.');
    } catch {
      const restored = getDefaultMemberFormConfig();
      setConfig(restored);
      setFormUrlInput(restored.viewUrl);
      setFormTitleInput(restored.formTitle);
      setShowAdminSetup(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyChecklist = async () => {
    const text = buildGoogleFormTemplateChecklist();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChecklist(true);
      setTimeout(() => setCopiedChecklist(false), 3000);
    } catch {
      setCopiedChecklist(false);
    }
  };

  const whatsAppHref = buildWhatsAppUrl(
    churchConfig.contact.whatsappNumber,
    "Hello God's Palace Evangelical Ministry Worldwide (GPEMWW), I need assistance with member registration.",
  );

  return (
    <div>
      <PageHeader
        eyebrow="Church Membership"
        title="Member Registration via Google Form"
        description="Official membership directory for God's Palace Evangelical Ministry Worldwide (GPEMWW). Complete your contact, household, and ministry details directly through our Google Form below."
      />

      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-8">
          {saveNotice && (
            <div
              role="status"
              className="p-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] text-sm text-[#14532D] flex items-center gap-2.5"
            >
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{saveNotice}</span>
            </div>
          )}

          {config && parseGoogleFormUrl(config.embedUrl).valid ? (
            <div className="space-y-6">
              <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#8B6F47]">
                      Official Google Form · Connected
                    </p>
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
                      {config.formTitle}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={config.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap"
                    >
                      <span>Open Form in Full Screen</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowAdminSetup((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#52525B] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors whitespace-nowrap"
                    >
                      <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{showAdminSetup ? 'Hide Form Settings' : 'Change Google Form'}</span>
                    </button>
                  </div>
                </div>

                {showAdminSetup && (
                  <div className="p-6 border-b border-[#E5E0D8] bg-[#F2EFE9]/55">
                    <form onSubmit={handleConnectForm} className="space-y-4 max-w-2xl">
                      <div>
                        <label
                          htmlFor="update-google-form-url"
                          className="block text-sm font-medium text-[#18181B] mb-1"
                        >
                          Google Form URL
                        </label>
                        <input
                          id="update-google-form-url"
                          type="url"
                          required
                          value={formUrlInput}
                          onChange={(e) => setFormUrlInput(e.target.value)}
                          placeholder="https://docs.google.com/forms/d/e/.../viewform"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D6D0C4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="update-google-form-title"
                          className="block text-sm font-medium text-[#18181B] mb-1"
                        >
                          Heading on Page
                        </label>
                        <input
                          id="update-google-form-title"
                          type="text"
                          value={formTitleInput}
                          onChange={(e) => setFormTitleInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D6D0C4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"
                        />
                      </div>
                      {error && (
                        <p role="alert" className="text-sm text-[#991B1B]">
                          {error}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] disabled:opacity-60 transition-colors"
                        >
                          {saving ? 'Saving...' : 'Save Updated Link'}
                        </button>
                        {!config.isDefault && (
                          <button
                            type="button"
                            onClick={handleRestoreDefaultForm}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#1B365D] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" aria-hidden="true" />
                            <span>Restore Official Form</span>
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white">
                  {config.embedUrl.includes('docs.google.com/forms') ? (
                    <iframe
                      src={config.embedUrl}
                      title={config.formTitle}
                      className="w-full min-h-[820px] border-0"
                    >
                      Loading Google Form...
                    </iframe>
                  ) : (
                    <div className="p-8 sm:p-12 text-center space-y-4">
                      <p className="text-sm sm:text-base text-[#52525B] max-w-lg mx-auto">
                        Click below to open our church&rsquo;s official Google Form directly and
                        submit your member registration details.
                      </p>
                      <a
                        href={config.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors"
                      >
                        <span>Fill Out Member Registration Google Form</span>
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#E5E0D8] rounded-xl px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-sm text-[#52525B]">
                <p>
                  Having trouble viewing the embedded form?{' '}
                  <a
                    href={config.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1B365D] font-medium hover:underline"
                  >
                    Open it directly in Google Forms
                  </a>{' '}
                  or reach our church office on{' '}
                  <a
                    href={whatsAppHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#14532D] font-medium hover:underline"
                  >
                    WhatsApp ({churchConfig.contact.phone})
                  </a>
                  .
                </p>
                <Link
                  to="/visit"
                  className="text-sm font-medium text-[#1B365D] hover:underline whitespace-nowrap"
                >
                  Plan a Sunday Visit &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Connect Google Form Card */}
              <div className="lg:col-span-5 bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-8 space-y-6">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#F2EFE9] text-[#1B365D] flex items-center justify-center mb-4">
                    <UserPlus className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                    Step 1 &amp; 2 · Church Office Setup
                  </p>
                  <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-1">
                    Connect Your Church Google Form
                  </h2>
                  <p className="mt-2 text-sm text-[#52525B] leading-relaxed">
                    Create a Google Form using the member checklist on the right so every response
                    saves automatically into your church&rsquo;s Google Forms &amp; Google Sheets
                    directory, then paste your form link below.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E5E0D8] space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
                    Quick Launch
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href="https://docs.google.com/forms/u/0/create"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1B365D] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Create New Google Form</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyChecklist}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#18181B] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#F2EFE9] transition-colors"
                    >
                      {copiedChecklist ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#14532D]" aria-hidden="true" />
                          <span>Questions Copied</span>
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Copy Question List</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleConnectForm} className="space-y-4">
                  <div>
                    <label
                      htmlFor="google-form-url"
                      className="block text-sm font-medium text-[#18181B] mb-1"
                    >
                      Paste Your Google Form Link *
                    </label>
                    <input
                      id="google-form-url"
                      type="url"
                      required
                      value={formUrlInput}
                      onChange={(e) => setFormUrlInput(e.target.value)}
                      placeholder="https://docs.google.com/forms/d/e/.../viewform"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D6D0C4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"
                    />
                    <p className="mt-1 text-xs text-[#71717A]">
                      Accepts any <code className="font-mono">docs.google.com/forms</code> or{' '}
                      <code className="font-mono">forms.gle</code> share link.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="google-form-title"
                      className="block text-sm font-medium text-[#18181B] mb-1"
                    >
                      Form Heading
                    </label>
                    <input
                      id="google-form-title"
                      type="text"
                      value={formTitleInput}
                      onChange={(e) => setFormTitleInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D6D0C4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D]"
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs sm:text-sm text-[#991B1B]"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-5 py-3 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] disabled:opacity-60 transition-colors"
                  >
                    {saving ? 'Connecting Google Form...' : 'Connect & Embed Google Form'}
                  </button>
                </form>

                <div className="pt-4 border-t border-[#E5E0D8] text-xs text-[#52525B] space-y-2">
                  <p>
                    Visiting for the first time? You can also{' '}
                    <Link to="/visit" className="text-[#1B365D] font-medium hover:underline">
                      plan your Sunday visit here
                    </Link>{' '}
                    or message the church office on{' '}
                    <a
                      href={whatsAppHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#14532D] font-medium hover:underline"
                    >
                      WhatsApp ({churchConfig.contact.phone})
                    </a>
                    .
                  </p>
                </div>
              </div>

              {/* Member Registration Details Checklist */}
              <div className="lg:col-span-7 bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3 pb-4 border-b border-[#E5E0D8]">
                  <div>
                    <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47]">
                      Recommended Google Form Structure
                    </p>
                    <h2 className="font-serif text-2xl font-semibold text-[#18181B] mt-1">
                      Details Gathered for Member Registration
                    </h2>
                  </div>
                  <span className="text-xs text-[#71717A] tabular-nums">
                    {MEMBER_REGISTRATION_FIELDS.length} structured fields
                  </span>
                </div>

                <div className="space-y-6">
                  {SECTIONS.map((section) => {
                    const fields = MEMBER_REGISTRATION_FIELDS.filter(
                      (f) => f.section === section,
                    );
                    return (
                      <div key={section} className="space-y-3">
                        <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#1B365D]">
                          {section}
                        </h3>
                        <div className="divide-y divide-[#E5E0D8] border border-[#E5E0D8] rounded-lg">
                          {fields.map((field) => (
                            <div key={field.id} className="p-3.5 sm:p-4 bg-[#FAF9F6]/60">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-[#18181B]">
                                  {field.label}
                                  {field.required && (
                                    <span className="ml-1 text-[#8B6F47]" aria-label="required">
                                      *
                                    </span>
                                  )}
                                </p>
                                <span className="text-[11px] font-medium text-[#71717A]">
                                  {field.fieldType}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[#52525B]">{field.helper}</p>
                              {field.options && (
                                <p className="mt-1.5 text-xs text-[#71717A]">
                                  <span className="font-medium text-[#3F3F46]">Options:</span>{' '}
                                  {field.options.join(' · ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
