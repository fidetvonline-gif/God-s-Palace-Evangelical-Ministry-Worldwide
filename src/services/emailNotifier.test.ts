import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGivingEmailContent,
  buildSubmissionEmailContent,
  getChurchNotificationEmail,
} from './emailNotifier.ts';

test('getChurchNotificationEmail defaults to gpemww@gmail.com', () => {
  assert.equal(getChurchNotificationEmail(), 'gpemww@gmail.com');
});

test('buildSubmissionEmailContent formats prayer and contact emails and escapes HTML', () => {
  const prayerEmail = buildSubmissionEmailContent('GH-ABC123', '2026-11-27T12:00:00Z', {
    type: 'prayer',
    fullName: 'Grace <script>alert(1)</script>',
    contactInfo: 'grace@example.com\r\nBcc:evil@example.com',
    prayerRequest: 'Pray for our family & peace.',
    privacyPreference: 'senior_pastor_only',
    consent: true,
  });

  assert.match(prayerEmail.subject, /GPEMWW Prayer Request/);
  assert.doesNotMatch(prayerEmail.html, /<script>/);
  assert.match(prayerEmail.html, /&lt;script&gt;/);
  assert.equal(prayerEmail.replyTo, undefined);

  const contactEmail = buildSubmissionEmailContent('GH-XYZ999', '2026-11-27T12:00:00Z', {
    type: 'contact',
    fullName: 'David Okafor',
    email: 'david@example.com',
    subject: 'Ministry Inquiry',
    message: 'Hello church office, I want to join the choir.',
  });

  assert.equal(contactEmail.replyTo, 'david@example.com');
  assert.match(contactEmail.subject, /Ministry Inquiry/);
  assert.match(contactEmail.text, /Hello church office/);
});

test('buildGivingEmailContent includes amount, category, narration, and donor email', () => {
  const email = buildGivingEmailContent(
    'GP-GIVE-112233',
    '2026-11-27T12:00:00Z',
    'TITHE - GRACE AKPAN',
    {
      category: 'tithe',
      amount: 25000,
      currency: 'NGN',
      frequency: 'one_time',
      isAnonymous: false,
      giverName: 'Grace Akpan',
      email: 'grace@example.com',
      phone: '+234 803 111 2233',
      transferConfirmed: true,
    },
  );

  assert.match(email.subject, /Tithe/);
  assert.match(email.subject, /₦25,000/);
  assert.equal(email.replyTo, 'grace@example.com');
  assert.match(email.text, /TITHE - GRACE AKPAN/);
});
