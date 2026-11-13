'use strict';
// POST /api/lead: stores one website sign-up in Azure Table Storage.
//
// Needs one app setting on the Static Web App (never in the repository):
//   LEADS_TABLE_SAS_URL = https://<account>.table.core.windows.net/leads?<SAS token>
// The SAS token allows only "add" on the one table, so this function cannot read,
// change or delete stored sign-ups. No npm packages: Node's own fetch and crypto.
// Never log the SAS URL or anything a visitor typed.

const crypto = require('crypto');

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const MODES = new Set(['updates', 'talk', 'download', 'nudge']);
const MAX_BODY = 8000;

function clean(v, max) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
}

function parse(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse(req.rawBody || '{}'); } catch (e) { return null; }
}

function buildEntity(b, now = new Date(), id = crypto.randomUUID()) {
  const iso = now.toISOString();
  return {
    PartitionKey: iso.slice(0, 7),          // one partition per month, e.g. 2026-11
    RowKey: `${iso}_${id}`,
    createdAt: iso,
    email: clean(b.email, 254).toLowerCase(),
    name: clean(b.name, 100),
    company: clean(b.company, 120),
    message: clean(b.message, 2000),
    source: MODES.has(b.source) ? b.source : 'updates',
    page: clean(b.page, 200),
    consent: true,
    consentText: clean(b.consentText, 400)
  };
}

// Returns [status, body]. Pure apart from the insert call, so it can be tested.
async function handle(req, env = process.env, insert = insertRow) {
  if ((req.rawBody || '').length > MAX_BODY) return [413, { ok: false, error: 'Message too long.' }];
  const b = parse(req);
  if (!b || typeof b !== 'object') return [400, { ok: false, error: 'Invalid request.' }];
  if (b.website) return [200, { ok: true }];                     // spam trap filled in: pretend success
  if (!EMAIL.test(clean(b.email, 254))) return [400, { ok: false, error: 'Please enter a valid email address.' }];
  if (b.consent !== true) return [400, { ok: false, error: 'Please tick the box to agree to be contacted.' }];
  if (!env.LEADS_TABLE_SAS_URL) return [503, { ok: false, error: 'Sign-up is not available right now. Please try again later.' }];
  const status = await insert(env.LEADS_TABLE_SAS_URL, buildEntity(b));
  if (status < 200 || status >= 300) return [502, { ok: false, error: 'Could not save your details. Please try again later.', code: status }];
  return [200, { ok: true }];
}

async function insertRow(sasUrl, entity) {
  const r = await fetch(sasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json;odata=nometadata',
      'x-ms-version': '2019-02-02',
      Prefer: 'return-no-content'
    },
    body: JSON.stringify(entity)
  });
  return r.status;
}

module.exports = async function (context, req) {
  let status, body;
  try {
    [status, body] = await handle(req);
  } catch (e) {
    context.log.error('lead: insert failed', e && e.name);
    [status, body] = [500, { ok: false, error: 'Could not save your details. Please try again later.' }];
  }
  if (status >= 500) context.log.warn(`lead: returned ${status}${body.code ? ` (storage ${body.code})` : ''}`);
  delete body.code;
  context.res = { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
};
module.exports.handle = handle;
module.exports.buildEntity = buildEntity;
