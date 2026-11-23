export type SubmissionType = 'visitor' | 'prayer' | 'contact';

export type PrayerPrivacyPreference = 'prayer_team' | 'senior_pastor_only';

export interface VisitorSubmissionInput {
  type: 'visitor';
  fullName: string;
  phone: string;
  email?: string;
  visitDate?: string;
  message?: string;
  consent: boolean;
  website?: string; // Honeypot field (must remain empty)
}

export interface PrayerSubmissionInput {
  type: 'prayer';
  fullName?: string;
  contactInfo?: string;
  prayerRequest: string;
  privacyPreference: PrayerPrivacyPreference;
  consent: boolean;
  website?: string; // Honeypot field
}

export interface ContactSubmissionInput {
  type: 'contact';
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  website?: string; // Honeypot field
}

export type SubmissionPayload =
  | VisitorSubmissionInput
  | PrayerSubmissionInput
  | ContactSubmissionInput;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  isSpam: boolean;
  sanitized?: SubmissionPayload;
}

export type ActivityStatus = 'upcoming' | 'completed';

export interface ChurchActivityItem {
  id: string;
  title: string;
  category: string;
  date: string;
  isoDate: string;
  time: string;
  venue: string;
  status: ActivityStatus;
  description: string;
  image?: string;
  registrationLabel?: string;
  registrationHref?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[+\d\s().-]{7,20}$/;

function cleanText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export function validateSubmission(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, isSpam: false, errors: { form: 'Invalid submission payload.' } };
  }

  const raw = input as Record<string, unknown>;
  const honeypot = cleanText(raw.website, 200);
  if (honeypot.length > 0) {
    return {
      valid: false,
      isSpam: true,
      errors: { form: 'Submission rejected by spam protection.' },
    };
  }

  const type = raw.type;
  const errors: Record<string, string> = {};

  if (type === 'visitor') {
    const fullName = cleanText(raw.fullName, 120);
    const phone = cleanText(raw.phone, 40);
    const email = cleanText(raw.email, 160);
    const visitDate = cleanText(raw.visitDate, 40);
    const message = cleanText(raw.message, 2000);
    const consent = raw.consent === true;

    if (fullName.length < 2) {
      errors.fullName = 'Please enter your full name.';
    }
    if (!PHONE_REGEX.test(phone)) {
      errors.phone = 'Please enter a valid phone number.';
    }
    if (email.length > 0 && !EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address or leave it blank.';
    }
    if (!consent) {
      errors.consent = 'Please confirm that we may contact you regarding your visit.';
    }

    if (Object.keys(errors).length > 0) {
      return { valid: false, isSpam: false, errors };
    }

    return {
      valid: true,
      isSpam: false,
      errors: {},
      sanitized: {
        type: 'visitor',
        fullName,
        phone,
        email: email || undefined,
        visitDate: visitDate || undefined,
        message: message || undefined,
        consent: true,
      },
    };
  }

  if (type === 'prayer') {
    const fullName = cleanText(raw.fullName, 120);
    const contactInfo = cleanText(raw.contactInfo, 160);
    const prayerRequest = cleanText(raw.prayerRequest, 3000);
    const privacyPreference: PrayerPrivacyPreference =
      raw.privacyPreference === 'senior_pastor_only' ? 'senior_pastor_only' : 'prayer_team';
    const consent = raw.consent === true;

    if (prayerRequest.length < 5) {
      errors.prayerRequest = 'Please share your prayer request (at least 5 characters).';
    }
    if (!consent) {
      errors.consent = 'Please confirm your privacy consent before submitting.';
    }

    if (Object.keys(errors).length > 0) {
      return { valid: false, isSpam: false, errors };
    }

    return {
      valid: true,
      isSpam: false,
      errors: {},
      sanitized: {
        type: 'prayer',
        fullName: fullName || undefined,
        contactInfo: contactInfo || undefined,
        prayerRequest,
        privacyPreference,
        consent: true,
      },
    };
  }

  if (type === 'contact') {
    const fullName = cleanText(raw.fullName, 120);
    const email = cleanText(raw.email, 160);
    const phone = cleanText(raw.phone, 40);
    const subject = cleanText(raw.subject, 160);
    const message = cleanText(raw.message, 3000);

    if (fullName.length < 2) {
      errors.fullName = 'Please enter your full name.';
    }
    if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (phone.length > 0 && !PHONE_REGEX.test(phone)) {
      errors.phone = 'Please enter a valid phone number or leave it blank.';
    }
    if (subject.length < 2) {
      errors.subject = 'Please enter a subject for your message.';
    }
    if (message.length < 10) {
      errors.message = 'Please enter a message (at least 10 characters).';
    }

    if (Object.keys(errors).length > 0) {
      return { valid: false, isSpam: false, errors };
    }

    return {
      valid: true,
      isSpam: false,
      errors: {},
      sanitized: {
        type: 'contact',
        fullName,
        email,
        phone: phone || undefined,
        subject,
        message,
      },
    };
  }

  return {
    valid: false,
    isSpam: false,
    errors: { form: 'Unsupported form submission type.' },
  };
}

export function createSubmissionFingerprint(payload: SubmissionPayload): string {
  switch (payload.type) {
    case 'visitor':
      return `visitor|${payload.fullName.toLowerCase()}|${payload.phone}`;
    case 'prayer':
      return `prayer|${payload.prayerRequest.toLowerCase().slice(0, 120)}|${payload.privacyPreference}`;
    case 'contact':
      return `contact|${payload.email.toLowerCase()}|${payload.subject.toLowerCase()}`;
  }
}

export function isDuplicateSubmission(
  recentFingerprints: Map<string, number>,
  fingerprint: string,
  nowMs: number,
  windowMs = 60_000,
): boolean {
  for (const [key, ts] of recentFingerprints.entries()) {
    if (nowMs - ts > windowMs) {
      recentFingerprints.delete(key);
    }
  }
  const previous = recentFingerprints.get(fingerprint);
  if (previous !== undefined && nowMs - previous <= windowMs) {
    return true;
  }
  return false;
}

export function filterActivities(
  activities: ChurchActivityItem[],
  filter: 'all' | ActivityStatus,
): ChurchActivityItem[] {
  const filtered =
    filter === 'all'
      ? [...activities]
      : activities.filter((item) => item.status === filter);

  return filtered.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'upcoming' ? -1 : 1;
    }
    return a.status === 'upcoming'
      ? a.isoDate.localeCompare(b.isoDate)
      : b.isoDate.localeCompare(a.isoDate);
  });
}

export function buildWhatsAppUrl(phoneNumber: string, prefillText?: string): string {
  const digits = phoneNumber.replace(/[^\d]/g, '');
  if (!digits) return '#';
  const base = `https://wa.me/${digits}`;
  if (prefillText && prefillText.trim().length > 0) {
    return `${base}?text=${encodeURIComponent(prefillText.trim())}`;
  }
  return base;
}

export function buildGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function buildGoogleMapsEmbedUrl(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}
