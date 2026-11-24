import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleFormTemplateChecklist,
  MEMBER_REGISTRATION_FIELDS,
  parseGoogleFormUrl,
} from './memberFormLogic.ts';

test('parseGoogleFormUrl normalizes standard viewform and edit URLs into safe embed URLs', () => {
  const pub = parseGoogleFormUrl(
    'https://docs.google.com/forms/d/e/1FAIpQLSfExampleFormId12345/viewform?usp=sf_link',
  );
  assert.equal(pub.valid, true);
  assert.equal(pub.isShortLink, false);
  assert.equal(
    pub.viewUrl,
    'https://docs.google.com/forms/d/e/1FAIpQLSfExampleFormId12345/viewform',
  );
  assert.equal(
    pub.embedUrl,
    'https://docs.google.com/forms/d/e/1FAIpQLSfExampleFormId12345/viewform?embedded=true',
  );

  const editUrl = parseGoogleFormUrl(
    'https://docs.google.com/forms/d/1AbCDefGhIjKlMnOpQrStUvWxYz/edit#responses',
  );
  assert.equal(editUrl.valid, true);
  assert.equal(
    editUrl.embedUrl,
    'https://docs.google.com/forms/d/1AbCDefGhIjKlMnOpQrStUvWxYz/viewform?embedded=true',
  );
});

test('parseGoogleFormUrl validates forms.gle short links and rejects unsafe or non-Google domains', () => {
  const short = parseGoogleFormUrl('https://forms.gle/abc123XYZ');
  assert.equal(short.valid, true);
  assert.equal(short.isShortLink, true);
  assert.equal(short.viewUrl, 'https://forms.gle/abc123XYZ');

  const httpRejected = parseGoogleFormUrl('http://docs.google.com/forms/d/e/1FAIpQLSfExample123/viewform');
  assert.equal(httpRejected.valid, false);

  const otherDomain = parseGoogleFormUrl('https://evil.example.com/forms/d/e/1FAIpQLSfExample123/viewform');
  assert.equal(otherDomain.valid, false);

  const jsScheme = parseGoogleFormUrl('javascript:alert(1)');
  assert.equal(jsScheme.valid, false);
});

test('member registration template covers required contact, household, and ministry fields', () => {
  assert.ok(MEMBER_REGISTRATION_FIELDS.length >= 10);
  const checklist = buildGoogleFormTemplateChecklist();
  assert.match(checklist, /Full Name/);
  assert.match(checklist, /Phone Number & WhatsApp/);
  assert.match(checklist, /Residential Address/);
  assert.match(checklist, /Next of Kin/);
  assert.match(checklist, /Departments \/ Ministries/);
});
