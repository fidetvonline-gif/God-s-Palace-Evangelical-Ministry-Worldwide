import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleMapsUrl,
  buildWhatsAppUrl,
  createSubmissionFingerprint,
  filterActivities,
  isDuplicateSubmission,
  validateSubmission,
  type ChurchActivityItem,
} from './churchLogic';

test('validateSubmission accepts valid first-time visitor payload', () => {
  const result = validateSubmission({
    type: 'visitor',
    fullName: 'Hannah Brooks',
    phone: '+1 (555) 234-8899',
    email: 'hannah@example.com',
    visitDate: '2026-12-06',
    message: 'Visiting with my family this Sunday.',
    consent: true,
    website: '',
  });

  assert.equal(result.valid, true);
  assert.equal(result.isSpam, false);
  assert.equal(result.sanitized?.type, 'visitor');
});

test('validateSubmission rejects missing required visitor fields and missing consent', () => {
  const result = validateSubmission({
    type: 'visitor',
    fullName: 'A',
    phone: '123',
    email: 'bad-email',
    consent: false,
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.fullName);
  assert.ok(result.errors.phone);
  assert.ok(result.errors.email);
  assert.ok(result.errors.consent);
});

test('validateSubmission flags filled honeypot field as spam', () => {
  const result = validateSubmission({
    type: 'contact',
    fullName: 'Bot User',
    email: 'bot@example.com',
    subject: 'Promo',
    message: 'Click this link right now please',
    website: 'https://spam-link.example',
  });

  assert.equal(result.valid, false);
  assert.equal(result.isSpam, true);
});

test('validateSubmission validates prayer requests with optional name and privacy preference', () => {
  const validAnon = validateSubmission({
    type: 'prayer',
    prayerRequest: 'Please pray for peace and healing for my mother.',
    privacyPreference: 'senior_pastor_only',
    consent: true,
  });

  assert.equal(validAnon.valid, true);
  if (validAnon.sanitized?.type === 'prayer') {
    assert.equal(validAnon.sanitized.fullName, undefined);
    assert.equal(validAnon.sanitized.privacyPreference, 'senior_pastor_only');
  }

  const tooShort = validateSubmission({
    type: 'prayer',
    prayerRequest: 'Hi',
    privacyPreference: 'prayer_team',
    consent: true,
  });
  assert.equal(tooShort.valid, false);
  assert.ok(tooShort.errors.prayerRequest);
});

test('validateSubmission validates contact form required fields', () => {
  const ok = validateSubmission({
    type: 'contact',
    fullName: 'David Park',
    email: 'david.park@example.com',
    subject: 'Joining the Choir',
    message: 'Hello, I would love to learn when choir rehearsals happen.',
  });
  assert.equal(ok.valid, true);

  const missingMsg = validateSubmission({
    type: 'contact',
    fullName: 'David Park',
    email: 'david.park@example.com',
    subject: 'Question',
    message: 'Short',
  });
  assert.equal(missingMsg.valid, false);
  assert.ok(missingMsg.errors.message);
});

test('isDuplicateSubmission blocks rapid duplicate fingerprints within window and expires old ones', () => {
  const recent = new Map<string, number>();
  const fp = createSubmissionFingerprint({
    type: 'contact',
    fullName: 'Claire',
    email: 'claire@example.com',
    subject: 'Welcome',
    message: 'Hello church office!',
  });

  assert.equal(isDuplicateSubmission(recent, fp, 1000, 60_000), false);
  recent.set(fp, 1000);
  assert.equal(isDuplicateSubmission(recent, fp, 30_000, 60_000), true);
  assert.equal(isDuplicateSubmission(recent, fp, 65_000, 60_000), false);
});

test('filterActivities separates upcoming and completed events in proper order', () => {
  const items: ChurchActivityItem[] = [
    {
      id: '1',
      title: 'Past Retreat',
      category: 'Retreat',
      date: 'Oct 10, 2026',
      isoDate: '2026-10-10',
      time: '9:00 AM',
      venue: 'Chapel',
      status: 'completed',
      description: 'Completed.',
    },
    {
      id: '2',
      title: 'Later Event',
      category: 'Outreach',
      date: 'Dec 20, 2026',
      isoDate: '2026-12-20',
      time: '10:00 AM',
      venue: 'Courtyard',
      status: 'upcoming',
      description: 'Upcoming later.',
    },
    {
      id: '3',
      title: 'Sooner Event',
      category: 'Worship',
      date: 'Dec 06, 2026',
      isoDate: '2026-12-06',
      time: '6:00 PM',
      venue: 'Sanctuary',
      status: 'upcoming',
      description: 'Upcoming sooner.',
    },
  ];

  const all = filterActivities(items, 'all');
  assert.deepEqual(
    all.map((i) => i.id),
    ['3', '2', '1'],
  );

  const upcomingOnly = filterActivities(items, 'upcoming');
  assert.deepEqual(
    upcomingOnly.map((i) => i.id),
    ['3', '2'],
  );

  const completedOnly = filterActivities(items, 'completed');
  assert.deepEqual(
    completedOnly.map((i) => i.id),
    ['1'],
  );
});

test('URL builders produce properly formatted WhatsApp and Google Maps links', () => {
  assert.equal(
    buildWhatsAppUrl('+1 (555) 014-8290', 'Hello Grace Harbor'),
    'https://wa.me/15550148290?text=Hello%20Grace%20Harbor',
  );
  assert.equal(
    buildGoogleMapsUrl('240 Harborview Avenue, Brookfield, WA 98004'),
    'https://www.google.com/maps/search/?api=1&query=240%20Harborview%20Avenue%2C%20Brookfield%2C%20WA%2098004',
  );
});
