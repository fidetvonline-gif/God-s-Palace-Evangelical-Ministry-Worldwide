import nodemailer from 'nodemailer';
import type { SubmissionPayload } from '../utils/churchLogic.ts';
import {
  formatGivingAmount,
  getGivingCategory,
  type GivingSubmissionInput,
} from '../utils/givingLogic.ts';

export interface EmailDispatchResult {
  delivered: boolean;
  provider?: 'smtp' | 'resend';
  recipient: string;
}

const DEFAULT_CHURCH_EMAIL = 'gpemww@gmail.com';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanHeaderAddress(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[\r\n<>]/g, '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleaned) ? cleaned : undefined;
}

export function getChurchNotificationEmail(): string {
  const configured = (process.env.CHURCH_NOTIFICATION_EMAIL || '').trim();
  return cleanHeaderAddress(configured) ?? DEFAULT_CHURCH_EMAIL;
}

export function buildSubmissionEmailContent(
  id: string,
  submittedAt: string,
  payload: SubmissionPayload,
): { subject: string; text: string; html: string; replyTo?: string } {
  if (payload.type === 'prayer') {
    const privacyLabel =
      payload.privacyPreference === 'senior_pastor_only'
        ? 'Senior Pastor Only (Strictly Confidential)'
        : 'Pastoral & Prayer Team';
    const subject = `[GPEMWW Prayer Request] ${id} · ${privacyLabel}`;
    const lines = [
      `New Prayer Request — God's Palace Evangelical Ministry Worldwide`,
      `Reference: ${id}`,
      `Submitted: ${submittedAt}`,
      `Privacy Preference: ${privacyLabel}`,
      `Name: ${payload.fullName || 'Anonymous'}`,
      `Contact Info: ${payload.contactInfo || 'Not provided'}`,
      ``,
      `Prayer Request:`,
      payload.prayerRequest,
    ];
    return {
      subject,
      text: lines.join('\n'),
      html: `
        <div style="font-family: Georgia, serif; color: #18181B; max-width: 600px;">
          <h2 style="color: #1B365D; margin-bottom: 8px;">New Prayer Request (${escapeHtml(id)})</h2>
          <p style="font-family: sans-serif; font-size: 14px; color: #52525B;">
            <strong>Privacy:</strong> ${escapeHtml(privacyLabel)}<br/>
            <strong>Name:</strong> ${escapeHtml(payload.fullName || 'Anonymous')}<br/>
            <strong>Contact Info:</strong> ${escapeHtml(payload.contactInfo || 'Not provided')}<br/>
            <strong>Submitted:</strong> ${escapeHtml(submittedAt)}
          </p>
          <div style="margin-top: 16px; padding: 14px; background: #FAF9F6; border: 1px solid #E5E0D8; border-radius: 8px; font-family: sans-serif; font-size: 14px; white-space: pre-wrap;">${escapeHtml(payload.prayerRequest)}</div>
        </div>
      `,
      replyTo: cleanHeaderAddress(payload.contactInfo),
    };
  }

  if (payload.type === 'visitor') {
    const subject = `[GPEMWW Visit Plan] ${payload.fullName} (${id})`;
    const lines = [
      `New First-Time Visitor Registration — GPEMWW`,
      `Reference: ${id}`,
      `Submitted: ${submittedAt}`,
      `Full Name: ${payload.fullName}`,
      `Phone: ${payload.phone}`,
      `Email: ${payload.email || 'Not provided'}`,
      `Planned Visit Date: ${payload.visitDate || 'Not specified'}`,
      ``,
      `Message / Notes:`,
      payload.message || 'None',
    ];
    return {
      subject,
      text: lines.join('\n'),
      html: `
        <div style="font-family: Georgia, serif; color: #18181B; max-width: 600px;">
          <h2 style="color: #1B365D; margin-bottom: 8px;">Plan Your Visit Submission (${escapeHtml(id)})</h2>
          <p style="font-family: sans-serif; font-size: 14px; color: #52525B;">
            <strong>Full Name:</strong> ${escapeHtml(payload.fullName)}<br/>
            <strong>Phone:</strong> ${escapeHtml(payload.phone)}<br/>
            <strong>Email:</strong> ${escapeHtml(payload.email || 'Not provided')}<br/>
            <strong>Planned Visit Date:</strong> ${escapeHtml(payload.visitDate || 'Not specified')}<br/>
            <strong>Submitted:</strong> ${escapeHtml(submittedAt)}
          </p>
          <div style="margin-top: 16px; padding: 14px; background: #FAF9F6; border: 1px solid #E5E0D8; border-radius: 8px; font-family: sans-serif; font-size: 14px; white-space: pre-wrap;">${escapeHtml(payload.message || 'No additional notes.')}</div>
        </div>
      `,
      replyTo: cleanHeaderAddress(payload.email),
    };
  }

  const subject = `[GPEMWW Contact] ${payload.subject} — ${payload.fullName}`;
  const lines = [
    `New Contact Us Message — God's Palace Evangelical Ministry Worldwide`,
    `Reference: ${id}`,
    `Submitted: ${submittedAt}`,
    `Full Name: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone || 'Not provided'}`,
    `Subject: ${payload.subject}`,
    ``,
    `Message:`,
    payload.message,
  ];
  return {
    subject,
    text: lines.join('\n'),
    html: `
      <div style="font-family: Georgia, serif; color: #18181B; max-width: 600px;">
        <h2 style="color: #1B365D; margin-bottom: 8px;">New Contact Us Message (${escapeHtml(id)})</h2>
        <p style="font-family: sans-serif; font-size: 14px; color: #52525B;">
          <strong>From:</strong> ${escapeHtml(payload.fullName)} (${escapeHtml(payload.email)})<br/>
          <strong>Phone:</strong> ${escapeHtml(payload.phone || 'Not provided')}<br/>
          <strong>Subject:</strong> ${escapeHtml(payload.subject)}<br/>
          <strong>Submitted:</strong> ${escapeHtml(submittedAt)}
        </p>
        <div style="margin-top: 16px; padding: 14px; background: #FAF9F6; border: 1px solid #E5E0D8; border-radius: 8px; font-family: sans-serif; font-size: 14px; white-space: pre-wrap;">${escapeHtml(payload.message)}</div>
      </div>
    `,
    replyTo: cleanHeaderAddress(payload.email),
  };
}

export function buildGivingEmailContent(
  id: string,
  submittedAt: string,
  narration: string,
  payload: Omit<GivingSubmissionInput, 'website'>,
): { subject: string; text: string; html: string; replyTo?: string } {
  const categoryLabel = getGivingCategory(payload.category).label;
  const formattedAmount = formatGivingAmount(payload.amount, payload.currency);
  const donorName = payload.isAnonymous ? 'Anonymous' : payload.giverName || 'Not provided';
  const subject = `[GPEMWW Giving] ${categoryLabel} · ${formattedAmount} (${id})`;

  const lines = [
    `New Giving / Transfer Notification — GPEMWW`,
    `Reference: ${id}`,
    `Submitted: ${submittedAt}`,
    `Purpose: ${categoryLabel} (${payload.frequency === 'monthly' ? 'Monthly' : 'One-Time'})`,
    `Amount: ${formattedAmount} (${payload.currency})`,
    `Donor Name: ${donorName}`,
    `Email: ${payload.email || 'Not provided'}`,
    `Phone / WhatsApp: ${payload.phone || 'Not provided'}`,
    `Transfer Narration: ${narration}`,
    `Sender Bank / Ref: ${payload.transferReference || 'Not provided'}`,
    ``,
    `Prayer / Dedication Note:`,
    payload.prayerNote || 'None',
  ];

  return {
    subject,
    text: lines.join('\n'),
    html: `
      <div style="font-family: Georgia, serif; color: #18181B; max-width: 600px;">
        <h2 style="color: #1B365D; margin-bottom: 8px;">New Giving Notification (${escapeHtml(id)})</h2>
        <p style="font-family: sans-serif; font-size: 14px; color: #52525B;">
          <strong>Purpose:</strong> ${escapeHtml(categoryLabel)} (${payload.frequency === 'monthly' ? 'Monthly' : 'One-Time'})<br/>
          <strong>Amount:</strong> ${escapeHtml(formattedAmount)}<br/>
          <strong>Donor:</strong> ${escapeHtml(donorName)}<br/>
          <strong>Email:</strong> ${escapeHtml(payload.email || 'Not provided')}<br/>
          <strong>Phone:</strong> ${escapeHtml(payload.phone || 'Not provided')}<br/>
          <strong>Narration:</strong> ${escapeHtml(narration)}<br/>
          <strong>Bank Reference:</strong> ${escapeHtml(payload.transferReference || 'Not provided')}
        </p>
        ${
          payload.prayerNote
            ? `<div style="margin-top: 16px; padding: 14px; background: #FAF9F6; border: 1px solid #E5E0D8; border-radius: 8px; font-family: sans-serif; font-size: 14px; white-space: pre-wrap;">${escapeHtml(payload.prayerNote)}</div>`
            : ''
        }
      </div>
    `,
    replyTo: cleanHeaderAddress(payload.email),
  };
}

export async function dispatchChurchEmail(message: {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<EmailDispatchResult> {
  const recipient = getChurchNotificationEmail();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim() || recipient;
  const smtpHost = (process.env.SMTP_HOST || '').trim() || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  if (smtpPass.length > 0 && smtpUser.length > 0) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 8_000,
        greetingTimeout: 8_000,
        socketTimeout: 10_000,
      });

      await transporter.sendMail({
        from: `"God's Palace Evangelical Ministry Worldwide" <${smtpUser}>`,
        to: recipient,
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      return { delivered: true, provider: 'smtp', recipient };
    } catch (err) {
      console.error('SMTP email dispatch failed:', err instanceof Error ? err.message : err);
    }
  }

  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey.length > 0) {
    try {
      const fromAddr =
        (process.env.RESEND_FROM_EMAIL || '').trim() ||
        "God's Palace Evangelical Ministry <onboarding@resend.dev>";
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [recipient],
          reply_to: message.replyTo,
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) {
        return { delivered: true, provider: 'resend', recipient };
      }
      console.error('Resend email dispatch failed with status:', res.status);
    } catch (err) {
      console.error('Resend email dispatch error:', err instanceof Error ? err.message : err);
    }
  }

  return { delivered: false, recipient };
}
