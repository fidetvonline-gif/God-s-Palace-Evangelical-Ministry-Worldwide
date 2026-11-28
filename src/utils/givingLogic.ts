export type GivingCategoryId =
  | 'tithe'
  | 'offering'
  | 'thanksgiving'
  | 'seed_faith'
  | 'building'
  | 'welfare_missions';

export type GivingCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR';
export type GivingFrequency = 'one_time' | 'monthly';

export interface GivingCategorySpec {
  id: GivingCategoryId;
  label: string;
  shortCode: string;
  description: string;
}

export const GIVING_CATEGORIES: GivingCategorySpec[] = [
  {
    id: 'tithe',
    label: 'Tithe',
    shortCode: 'TITHE',
    description: 'Covenant tenth honoring the Lord with the firstfruits of your increase.',
  },
  {
    id: 'offering',
    label: 'Offering',
    shortCode: 'OFFERING',
    description: 'Freewill worship offering supporting weekly sanctuary services and ministry.',
  },
  {
    id: 'thanksgiving',
    label: 'Thanksgiving',
    shortCode: 'THANKSGIVING',
    description: 'Testimony and gratitude seed for answered prayers and God’s faithfulness.',
  },
  {
    id: 'seed_faith',
    label: 'Seed Faith / First Fruit',
    shortCode: 'SEED',
    description: 'Dedicated covenant seed and first-fruit offering unto the Lord.',
  },
  {
    id: 'building',
    label: 'Building & Sanctuary',
    shortCode: 'BUILDING',
    description: 'Supporting sanctuary development at City of the Great King, Ikot Anwa.',
  },
  {
    id: 'welfare_missions',
    label: 'Welfare & Missions',
    shortCode: 'WELFARE',
    description: 'Community outreach, evangelism, and support for families and students.',
  },
];

export const CURRENCY_META: Record<
  GivingCurrency,
  { code: GivingCurrency; symbol: string; label: string; presets: number[] }
> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    label: 'Nigerian Naira (₦)',
    presets: [1000, 2000, 5000, 10000, 20000, 50000],
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar ($)',
    presets: [10, 25, 50, 100, 250, 500],
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: 'British Pound (£)',
    presets: [10, 25, 50, 100, 250, 500],
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'Euro (€)',
    presets: [10, 25, 50, 100, 250, 500],
  },
};

export interface BankAccountDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingOrSwift?: string;
}

export interface SecondaryBankAccount extends BankAccountDetails {
  label: string;
}

export interface GivingConfig {
  primaryAccount: BankAccountDetails;
  secondaryAccount?: SecondaryBankAccount;
  transferInstructions: string;
  isConfigured: boolean;
  updatedAt: string;
  source?: 'env' | 'saved' | 'default';
}

export interface GivingSubmissionInput {
  category: GivingCategoryId;
  amount: number;
  currency: GivingCurrency;
  frequency: GivingFrequency;
  isAnonymous: boolean;
  giverName?: string;
  phone?: string;
  email?: string;
  transferReference?: string;
  prayerNote?: string;
  transferConfirmed: boolean;
  website?: string;
}

export interface GivingValidationResult {
  valid: boolean;
  isSpam: boolean;
  errors: Record<string, string>;
  sanitized?: Omit<GivingSubmissionInput, 'website'>;
}

export interface GivingConfigValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: Omit<GivingConfig, 'isConfigured' | 'updatedAt' | 'source'>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[+\d\s().-]{7,20}$/;
const ACCOUNT_NUMBER_REGEX = /^[A-Za-z0-9-]{8,34}$/;

function cleanText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export const DEFAULT_CHURCH_BANK_ACCOUNT = {
  bankName: 'Zenith Bank',
  accountName: "God's Palace Evangelical Ministry Worldwide",
  accountNumber: '1015810561',
} as const;

export function getDefaultGivingConfig(): GivingConfig {
  return {
    primaryAccount: {
      bankName: DEFAULT_CHURCH_BANK_ACCOUNT.bankName,
      accountName: DEFAULT_CHURCH_BANK_ACCOUNT.accountName,
      accountNumber: DEFAULT_CHURCH_BANK_ACCOUNT.accountNumber,
      routingOrSwift: '',
    },
    transferInstructions:
      'Make your transfer to Zenith Bank (1015810561), include your name and giving purpose in the transfer narration, and contact us on WhatsApp (+234 813 695 8098) if you need quick confirmation.',
    isConfigured: true,
    updatedAt: '2026-11-27T00:00:00.000Z',
    source: 'default',
  };
}

export function isValidAccountNumber(raw: string): boolean {
  const compact = raw.replace(/\s+/g, '');
  return ACCOUNT_NUMBER_REGEX.test(compact);
}

export function normalizeAccountNumber(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export function getGivingCategory(id: GivingCategoryId): GivingCategorySpec {
  return GIVING_CATEGORIES.find((cat) => cat.id === id) ?? GIVING_CATEGORIES[0];
}

export function formatGivingAmount(amount: number, currency: GivingCurrency): string {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.NGN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return `${meta.symbol}0`;
  }
  const hasDecimals = Math.abs(amount % 1) > 0.001;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${meta.symbol}${formatted}`;
}

export function buildTransferNarration(
  category: GivingCategoryId,
  giverName?: string,
  isAnonymous = false,
): string {
  const spec = getGivingCategory(category);
  const cleanName = (giverName || '')
    .replace(/[^A-Za-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
  if (isAnonymous || !cleanName) {
    return `${spec.shortCode} - GPEMWW`;
  }
  return `${spec.shortCode} - ${cleanName}`.slice(0, 32).trim();
}

export function validateGivingConfigInput(input: unknown): GivingConfigValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: { form: 'Invalid account configuration data.' } };
  }

  const raw = input as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const bankName = cleanText(raw.bankName, 80);
  const accountName = cleanText(raw.accountName, 120);
  const accountNumber = normalizeAccountNumber(cleanText(raw.accountNumber, 40));
  const routingOrSwift = cleanText(raw.routingOrSwift, 32);
  const transferInstructions = cleanText(raw.transferInstructions, 500);

  if (bankName.length < 2) {
    errors.bankName = 'Please enter the bank name (e.g., Zenith Bank, First Bank, Access Bank).';
  }
  if (accountName.length < 3) {
    errors.accountName = 'Please enter the official church account name.';
  }
  if (!isValidAccountNumber(accountNumber)) {
    errors.accountNumber = 'Please enter a valid 10-digit account number or IBAN (8–34 characters).';
  }

  const secLabel = cleanText(raw.secondaryLabel, 60);
  const secBank = cleanText(raw.secondaryBankName, 80);
  const secAccName = cleanText(raw.secondaryAccountName, 120);
  const secAccNum = normalizeAccountNumber(cleanText(raw.secondaryAccountNumber, 40));

  const hasAnySecondary = Boolean(secLabel || secBank || secAccName || secAccNum);
  if (hasAnySecondary) {
    if (secLabel.length < 2) {
      errors.secondaryLabel = 'Please add a label for the second account (e.g., Building Project).';
    }
    if (secBank.length < 2) {
      errors.secondaryBankName = 'Please enter the bank name for the second account.';
    }
    if (secAccName.length < 3) {
      errors.secondaryAccountName = 'Please enter the account name for the second account.';
    }
    if (!isValidAccountNumber(secAccNum)) {
      errors.secondaryAccountNumber = 'Please enter a valid account number for the second account.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      primaryAccount: {
        bankName,
        accountName,
        accountNumber,
        routingOrSwift: routingOrSwift || undefined,
      },
      ...(hasAnySecondary
        ? {
            secondaryAccount: {
              label: secLabel,
              bankName: secBank,
              accountName: secAccName,
              accountNumber: secAccNum,
            },
          }
        : {}),
      transferInstructions:
        transferInstructions || getDefaultGivingConfig().transferInstructions,
    },
  };
}

export function validateGivingSubmission(input: unknown): GivingValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, isSpam: false, errors: { form: 'Invalid giving submission.' } };
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

  const errors: Record<string, string> = {};
  const validCategoryIds = new Set<GivingCategoryId>(GIVING_CATEGORIES.map((c) => c.id));
  const category = raw.category as GivingCategoryId;
  if (!validCategoryIds.has(category)) {
    errors.category = 'Please choose a giving purpose (e.g., Tithe or Offering).';
  }

  const parsedAmount =
    typeof raw.amount === 'number'
      ? raw.amount
      : typeof raw.amount === 'string'
        ? Number(raw.amount.replace(/,/g, '').trim())
        : NaN;

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100_000_000) {
    errors.amount = 'Please enter a valid giving amount greater than zero.';
  }

  const currency: GivingCurrency =
    raw.currency === 'USD' || raw.currency === 'GBP' || raw.currency === 'EUR'
      ? raw.currency
      : 'NGN';

  const frequency: GivingFrequency = raw.frequency === 'monthly' ? 'monthly' : 'one_time';
  const isAnonymous = raw.isAnonymous === true;
  const giverName = cleanText(raw.giverName, 120);
  const phone = cleanText(raw.phone, 40);
  const email = cleanText(raw.email, 160);
  const transferReference = cleanText(raw.transferReference, 80);
  const prayerNote = cleanText(raw.prayerNote, 1000);
  const transferConfirmed = raw.transferConfirmed === true;

  if (!isAnonymous && giverName.length < 2) {
    errors.giverName = 'Please enter your name or select "Give anonymously".';
  }
  if (phone.length > 0 && !PHONE_REGEX.test(phone)) {
    errors.phone = 'Please enter a valid phone number or leave it blank.';
  }
  if (email.length > 0 && !EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address or leave it blank.';
  }
  if (!transferConfirmed) {
    errors.transferConfirmed =
      'Please confirm that you have completed or initiated the transfer to the church account.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, isSpam: false, errors };
  }

  return {
    valid: true,
    isSpam: false,
    errors: {},
    sanitized: {
      category,
      amount: Math.round(parsedAmount * 100) / 100,
      currency,
      frequency,
      isAnonymous,
      giverName: isAnonymous ? undefined : giverName,
      phone: phone || undefined,
      email: email || undefined,
      transferReference: transferReference || undefined,
      prayerNote: prayerNote || undefined,
      transferConfirmed: true,
    },
  };
}

export function createGivingFingerprint(
  payload: Omit<GivingSubmissionInput, 'website'>,
): string {
  return [
    payload.category,
    payload.currency,
    payload.amount.toFixed(2),
    payload.isAnonymous ? 'anon' : (payload.giverName || '').toLowerCase(),
    (payload.transferReference || '').toLowerCase(),
  ].join('|');
}
