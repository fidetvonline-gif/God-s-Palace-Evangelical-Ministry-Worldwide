export interface GoogleFormParsedUrls {
  valid: boolean;
  viewUrl: string;
  embedUrl: string;
  isShortLink: boolean;
  error?: string;
}

export interface MemberFormConfig {
  viewUrl: string;
  embedUrl: string;
  formTitle: string;
  updatedAt: string;
  isDefault?: boolean;
}

export const DEFAULT_MEMBER_GOOGLE_FORM = {
  shortUrl: 'https://forms.gle/TUrY1qNhPUAJP4fQ9',
  viewUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSdPbKx1DwDvJoFy064m8rka9tdBRfagGmR_3g63fLm9cuf52w/viewform',
  embedUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSdPbKx1DwDvJoFy064m8rka9tdBRfagGmR_3g63fLm9cuf52w/viewform?embedded=true',
  formTitle: "God's Palace Member Registration Form",
} as const;

export function getDefaultMemberFormConfig(): MemberFormConfig {
  return {
    viewUrl: DEFAULT_MEMBER_GOOGLE_FORM.viewUrl,
    embedUrl: DEFAULT_MEMBER_GOOGLE_FORM.embedUrl,
    formTitle: DEFAULT_MEMBER_GOOGLE_FORM.formTitle,
    updatedAt: '2026-11-27T00:00:00.000Z',
    isDefault: true,
  };
}

export interface MemberFormFieldSpec {
  id: string;
  section: 'Contact Information' | 'Personal & Household' | 'Church & Ministry Details';
  label: string;
  fieldType: 'Short answer' | 'Paragraph' | 'Multiple choice' | 'Checkboxes' | 'Date';
  required: boolean;
  options?: string[];
  helper: string;
}

export const MEMBER_REGISTRATION_FIELDS: MemberFormFieldSpec[] = [
  {
    id: 'full-name',
    section: 'Contact Information',
    label: 'Full Name (Surname First)',
    fieldType: 'Short answer',
    required: true,
    helper: 'Legal and preferred name for church directory and pastoral care.',
  },
  {
    id: 'phone-whatsapp',
    section: 'Contact Information',
    label: 'Phone Number & WhatsApp Number',
    fieldType: 'Short answer',
    required: true,
    helper: 'Primary mobile number for church updates and pastoral follow-up.',
  },
  {
    id: 'email',
    section: 'Contact Information',
    label: 'Email Address',
    fieldType: 'Short answer',
    required: false,
    helper: 'Optional email address for programme notices and church bulletins.',
  },
  {
    id: 'residential-address',
    section: 'Contact Information',
    label: 'Residential Address / Hostel / Community',
    fieldType: 'Paragraph',
    required: true,
    helper: 'Home address or student hostel location (e.g., Ikot Anwa, Ukana, FedPoly Campus).',
  },
  {
    id: 'emergency-contact',
    section: 'Contact Information',
    label: 'Next of Kin / Emergency Contact (Name & Phone)',
    fieldType: 'Short answer',
    required: true,
    helper: 'Trusted family member or guardian contact in case of emergency.',
  },
  {
    id: 'gender',
    section: 'Personal & Household',
    label: 'Gender',
    fieldType: 'Multiple choice',
    required: true,
    options: ['Male', 'Female'],
    helper: 'Helps fellowship groups (Men’s / Women’s Fellowship) connect accurately.',
  },
  {
    id: 'marital-status',
    section: 'Personal & Household',
    label: 'Marital Status',
    fieldType: 'Multiple choice',
    required: true,
    options: ['Single', 'Married', 'Widowed'],
    helper: 'Used for family care and household fellowship groupings.',
  },
  {
    id: 'birth-date',
    section: 'Personal & Household',
    label: 'Birthday (Day & Month)',
    fieldType: 'Short answer',
    required: false,
    helper: 'So the church family can celebrate and pray with you on your birthday.',
  },
  {
    id: 'occupation-status',
    section: 'Personal & Household',
    label: 'Occupation / School (e.g., Federal Polytechnic Ukana Student, Business, Civil Service)',
    fieldType: 'Short answer',
    required: false,
    helper: 'Helps youth, campus, and career mentorship programmes serve you better.',
  },
  {
    id: 'membership-category',
    section: 'Church & Ministry Details',
    label: 'Membership Category',
    fieldType: 'Multiple choice',
    required: true,
    options: [
      'New Member Joining GPEMWW',
      'Existing Regular Member Updating Details',
      'New Convert / Rededication',
      'Student Member (Polytechnic / Campus)',
    ],
    helper: 'Identifies whether you are registering for the first time or updating existing details.',
  },
  {
    id: 'baptism-foundation',
    section: 'Church & Ministry Details',
    label: 'Have you completed Water Baptism and New Believers Foundation Class?',
    fieldType: 'Multiple choice',
    required: true,
    options: [
      'Yes, both completed',
      'Need Foundation Class',
      'Need Water Baptism',
      'Need both Foundation Class and Baptism',
    ],
    helper: 'Guides pastoral discipleship and upcoming baptism classes.',
  },
  {
    id: 'department-interest',
    section: 'Church & Ministry Details',
    label: 'Departments / Ministries You Want to Join',
    fieldType: 'Checkboxes',
    required: false,
    options: [
      'Choir & Worship Band',
      'Ushering Ministry',
      'Youth & Campus Ministry',
      "Children's Ministry",
      'Prayer & Intercessory Ministry',
      'Evangelism & Missions',
      'Media & Sound Ministry',
      'Welfare & Care Ministry',
      'Protocol Ministry',
      'Not sure yet — help me discern',
    ],
    helper: 'Select one or more ministry teams where you would like to serve.',
  },
  {
    id: 'pastoral-notes',
    section: 'Church & Ministry Details',
    label: 'Prayer Requests or Anything You Would Like the Pastorate to Know',
    fieldType: 'Paragraph',
    required: false,
    helper: 'Optional confidential note for Rev. Dr. Omorogieva and the pastoral team.',
  },
];

export function buildGoogleFormTemplateChecklist(): string {
  return [
    "God's Palace Evangelical Ministry Worldwide (GPEMWW) — Official Member Registration Form",
    'Subtitle: Please complete your contact information, household details, and ministry interests below.',
    '',
    ...MEMBER_REGISTRATION_FIELDS.map((field, index) => {
      const reqTag = field.required ? ' [Required]' : ' [Optional]';
      const opts = field.options ? `\n   Options: ${field.options.join(' | ')}` : '';
      return `${index + 1}. ${field.label} (${field.fieldType})${reqTag}${opts}`;
    }),
  ].join('\n');
}

export function parseGoogleFormUrl(rawUrl: string): GoogleFormParsedUrls {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      viewUrl: '',
      embedUrl: '',
      isShortLink: false,
      error: 'Please enter a valid Google Form link (e.g. https://docs.google.com/forms/d/e/.../viewform).',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      viewUrl: '',
      embedUrl: '',
      isShortLink: false,
      error: 'The link does not look like a valid web URL. Make sure it starts with https://.',
    };
  }

  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      viewUrl: '',
      embedUrl: '',
      isShortLink: false,
      error: 'Only secure HTTPS Google Form links are accepted.',
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'forms.gle') {
    const slug = parsed.pathname.replace(/^\/+|\/+$/g, '');
    if (!slug || !/^[A-Za-z0-9_-]{4,80}$/.test(slug)) {
      return {
        valid: false,
        viewUrl: '',
        embedUrl: '',
        isShortLink: true,
        error: 'This forms.gle short link looks incomplete.',
      };
    }
    const cleanShort = `https://forms.gle/${slug}`;
    return {
      valid: true,
      viewUrl: cleanShort,
      embedUrl: cleanShort,
      isShortLink: true,
    };
  }

  if (host !== 'docs.google.com') {
    return {
      valid: false,
      viewUrl: '',
      embedUrl: '',
      isShortLink: false,
      error: 'Please paste a Google Form link from docs.google.com/forms or forms.gle.',
    };
  }

  // Matches /forms/d/e/<publicId>/... or /forms/d/<formId>/...
  const publicMatch = parsed.pathname.match(/^\/forms\/d\/e\/([A-Za-z0-9_-]{10,})/);
  if (publicMatch) {
    const base = `https://docs.google.com/forms/d/e/${publicMatch[1]}/viewform`;
    return {
      valid: true,
      viewUrl: base,
      embedUrl: `${base}?embedded=true`,
      isShortLink: false,
    };
  }

  const directMatch = parsed.pathname.match(/^\/forms\/d\/([A-Za-z0-9_-]{10,})/);
  if (directMatch) {
    const base = `https://docs.google.com/forms/d/${directMatch[1]}/viewform`;
    return {
      valid: true,
      viewUrl: base,
      embedUrl: `${base}?embedded=true`,
      isShortLink: false,
    };
  }

  return {
    valid: false,
    viewUrl: '',
    embedUrl: '',
    isShortLink: false,
    error: 'Could not find a Google Form ID in that docs.google.com/forms URL.',
  };
}
