import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTransferNarration,
  createGivingFingerprint,
  formatGivingAmount,
  getDefaultGivingConfig,
  validateGivingConfigInput,
  validateGivingSubmission,
} from './givingLogic.ts';

test('getDefaultGivingConfig includes the official Zenith Bank account details', () => {
  const def = getDefaultGivingConfig();
  assert.equal(def.isConfigured, true);
  assert.equal(def.primaryAccount.bankName, 'Zenith Bank');
  assert.equal(def.primaryAccount.accountNumber, '1015810561');
  assert.equal(def.primaryAccount.accountName, "God's Palace Evangelical Ministry Worldwide");
});

test('validateGivingConfigInput accepts valid 10-digit primary and optional secondary accounts', () => {
  const ok = validateGivingConfigInput({
    bankName: 'Zenith Bank',
    accountName: "God's Palace Evangelical Ministry Worldwide",
    accountNumber: '1012 345 678',
    secondaryLabel: 'Sanctuary Building Fund',
    secondaryBankName: 'First Bank of Nigeria',
    secondaryAccountName: "God's Palace Building Project",
    secondaryAccountNumber: '2034567890',
  });

  assert.equal(ok.valid, true);
  assert.equal(ok.sanitized?.primaryAccount.accountNumber, '1012345678');
  assert.equal(ok.sanitized?.secondaryAccount?.accountNumber, '2034567890');
});

test('validateGivingConfigInput rejects missing bank name or invalid account number', () => {
  const bad = validateGivingConfigInput({
    bankName: '',
    accountName: 'GP',
    accountNumber: '123',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.bankName);
  assert.ok(bad.errors.accountName);
  assert.ok(bad.errors.accountNumber);
});

test('validateGivingSubmission validates tithe, offering, and anonymous giving', () => {
  const validTithe = validateGivingSubmission({
    category: 'tithe',
    amount: '15000',
    currency: 'NGN',
    frequency: 'monthly',
    isAnonymous: false,
    giverName: 'Adaobi Okafor',
    phone: '+234 803 111 2233',
    email: 'adaobi@example.com',
    transferReference: 'NIP-90231',
    prayerNote: 'Praying for open doors.',
    transferConfirmed: true,
    website: '',
  });

  assert.equal(validTithe.valid, true);
  assert.equal(validTithe.sanitized?.amount, 15000);
  assert.equal(validTithe.sanitized?.category, 'tithe');

  const validAnon = validateGivingSubmission({
    category: 'offering',
    amount: 5000,
    currency: 'NGN',
    frequency: 'one_time',
    isAnonymous: true,
    transferConfirmed: true,
  });
  assert.equal(validAnon.valid, true);
  assert.equal(validAnon.sanitized?.giverName, undefined);

  const missingConfirmation = validateGivingSubmission({
    category: 'offering',
    amount: 5000,
    currency: 'NGN',
    frequency: 'one_time',
    isAnonymous: false,
    giverName: 'Samuel',
    transferConfirmed: false,
  });
  assert.equal(missingConfirmation.valid, false);
  assert.ok(missingConfirmation.errors.transferConfirmed);
});

test('validateGivingSubmission blocks spam honeypot submissions', () => {
  const spam = validateGivingSubmission({
    category: 'tithe',
    amount: 1000,
    currency: 'NGN',
    frequency: 'one_time',
    isAnonymous: true,
    transferConfirmed: true,
    website: 'https://spam.example.com',
  });
  assert.equal(spam.valid, false);
  assert.equal(spam.isSpam, true);
});

test('formatGivingAmount, buildTransferNarration, and fingerprint format consistently', () => {
  assert.equal(formatGivingAmount(25000, 'NGN'), '₦25,000');
  assert.equal(formatGivingAmount(50.5, 'USD'), '$50.50');
  assert.equal(buildTransferNarration('tithe', 'John Doe', false), 'TITHE - JOHN DOE');
  assert.equal(buildTransferNarration('seed_faith', 'John Doe', true), 'SEED - GPEMWW');

  const fp = createGivingFingerprint({
    category: 'offering',
    amount: 2000,
    currency: 'NGN',
    frequency: 'one_time',
    isAnonymous: false,
    giverName: 'Mary',
    transferConfirmed: true,
  });
  assert.equal(fp, 'offering|NGN|2000.00|mary|');
});
