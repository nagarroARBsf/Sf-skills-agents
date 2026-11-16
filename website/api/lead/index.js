'use strict';
// POST /api/lead: emails one website sign-up to the team mailbox through
// Azure Communication Services Email. The email is the record; nothing is stored.
//
// App settings on the Static Web App (never in the repository):
//   ACS_CONNECTION_STRING  endpoint=https://<name>.<geo>.communication.azure.com/;accesskey=<key>
//   LEAD_EMAIL_FROM        DoNotReply@<id>.azurecomm.net (the Azure-managed sender)
//   LEAD_EMAIL_TO          the team mailbox that receives sign-ups
// No npm packages: requests are signed with Node's crypto (HMAC-SHA256) and sent with fetch.
// Never log the connection string or anything a visitor typed.

const crypto = require('crypto');

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const MAX_BODY = 8000;
const API_VERSION = '2023-03-31';
const MODES = {
  talk: 'Talk to us',
  updates: 'Get updates',
  nudge: 'Get updates (corner prompt)',
  download: 'After a download',
  soon: 'Coming soon (another coding agent)'
};

function clean(v, max) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
}
function cleanText(v, max) { // keeps line breaks, for the message box
  return typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
}
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parse(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse(req.rawBody || '{}'); } catch (e) { return null; }
}

// The sign-up, cleaned. Everything here ends up in the email.
function buildLead(b, now = new Date()) {
  const source = Object.prototype.hasOwnProperty.call(MODES, b.source) ? b.source : 'updates';
  return {
    at: now.toISOString(),
    email: clean(b.email, 254).toLowerCase(),
    name: clean(b.name, 100),
    company: clean(b.company, 120),
    message: cleanText(b.message, 2000),
    source,
    sourceLabel: MODES[source],
    page: clean(b.page, 200),
    consentText: clean(b.consentText, 400)
  };
}

function buildEmail(lead, from, to) {
  const who = lead.name || lead.email;
  const subject = `nagarro-salesforce-sdlc: ${lead.sourceLabel} - ${who}${lead.company ? ` (${lead.company})` : ''}`;
  const rows = [
    ['Email', lead.email],
    ['Name', lead.name || '-'],
    ['Company', lead.company || '-'],
    ['Came from', lead.sourceLabel],
    ['Page', lead.page || '/'],
    ['Received', `${lead.at} (UTC)`]
  ];
  const plain = [
    `New sign-up from the nagarro-salesforce-sdlc website (${lead.sourceLabel}).`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Message:',
    lead.message || '-',
    '',
    `Consent given: "${lead.consentText}"`,
    '',
    'Reply to this email to answer the visitor directly.'
  ].join('\n');
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#1d1c19">
<p>New sign-up from the nagarro-salesforce-sdlc website (<b>${esc(lead.sourceLabel)}</b>).</p>
<table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="color:#625f57">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
<p style="color:#625f57;margin-bottom:4px">Message</p>
<div style="white-space:pre-wrap;border-left:3px solid #e6e3d9;padding:4px 12px">${esc(lead.message || '-')}</div>
<p style="color:#625f57;font-size:12px">Consent given: "${esc(lead.consentText)}"<br>Reply to this email to answer the visitor directly.</p>
</div>`;
  return {
    senderAddress: from,
    recipients: { to: [{ address: to }] },
    replyTo: [{ address: lead.email, displayName: lead.name || lead.email }],
    content: { subject, plainText: plain, html },
    userEngagementTrackingDisabled: true
  };
}

function parseConnectionString(cs) {
  const parts = {};
  for (const p of String(cs || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) parts[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).trim();
  }
  if (!parts.endpoint || !parts.accesskey) return null;
  return { endpoint: parts.endpoint.replace(/\/+$/, ''), key: parts.accesskey };
}

// Azure Communication Services HMAC-SHA256 request signing.
function signedHeaders(method, url, body, key, date = new Date()) {
  const u = new URL(url);
  const contentHash = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  const xmsDate = date.toUTCString();
  const toSign = `${method}\n${u.pathname}${u.search}\n${xmsDate};${u.host};${contentHash}`;
  const signature = crypto.createHmac('sha256', Buffer.from(key, 'base64')).update(toSign, 'utf8').digest('base64');
  return {
    'x-ms-date': xmsDate,
    'x-ms-content-sha256': contentHash,
    Authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`
  };
}

async function sendEmail(conn, message) {
  const url = `${conn.endpoint}/emails:send?api-version=${API_VERSION}`;
  const body = JSON.stringify(message);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...signedHeaders('POST', url, body, conn.key) },
    body
  });
  return r.status; // 202 = accepted for delivery
}

// Returns [status, body]. Pure apart from the send call, so it can be tested.
async function handle(req, env = process.env, send = sendEmail) {
  if ((req.rawBody || '').length > MAX_BODY) return [413, { ok: false, error: 'Message too long.' }];
  const b = parse(req);
  if (!b || typeof b !== 'object') return [400, { ok: false, error: 'Invalid request.' }];
  if (b.website) return [200, { ok: true }];                     // spam trap filled in: pretend success
  if (!EMAIL.test(clean(b.email, 254))) return [400, { ok: false, error: 'Please enter a valid email address.' }];
  if (b.consent !== true) return [400, { ok: false, error: 'Please tick the box to agree to be contacted.' }];
  const conn = parseConnectionString(env.ACS_CONNECTION_STRING);
  if (!conn || !env.LEAD_EMAIL_FROM || !env.LEAD_EMAIL_TO) {
    return [503, { ok: false, error: 'Sign-up is not available right now. Please try again later.', code: 'config' }];
  }
  const status = await send(conn, buildEmail(buildLead(b), env.LEAD_EMAIL_FROM, env.LEAD_EMAIL_TO));
  if (status < 200 || status >= 300) return [502, { ok: false, error: 'Could not send your details. Please try again later.', code: status }];
  return [200, { ok: true }];
}

module.exports = async function (context, req) {
  let status, body;
  try {
    [status, body] = await handle(req);
  } catch (e) {
    context.log.error('lead: send failed', e && e.name);
    [status, body] = [500, { ok: false, error: 'Could not send your details. Please try again later.' }];
  }
  if (status >= 500) context.log.warn(`lead: returned ${status}${body.code ? ` (${body.code})` : ''}`);
  delete body.code;
  context.res = { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
};
module.exports.handle = handle;
module.exports.buildLead = buildLead;
module.exports.buildEmail = buildEmail;
module.exports.signedHeaders = signedHeaders;
module.exports.parseConnectionString = parseConnectionString;
