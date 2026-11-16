'use strict';
// Salesforce Diagrams in draw.io. A small diagram spec (JSON) becomes an editable .drawio file drawn
// to Salesforce's architecture diagram standard (architect.salesforce.com, "Reference Diagrams"):
// a header band with title, description and key; cards with icon, title, separator rule, attributes
// and a footer; cards as containers; elbow connectors with pills; the data model notation for ERDs.
// Icons are draw.io's built-in Salesforce library (mxgraph.salesforce.*), referenced by name only.
// Layout is computed here so that nobody hand-places coordinates. Node.js standard library only.

const fs = require('fs');
const path = require('path');
const lib = require('./lib');

// ------------------------------------------------------------------ vocabulary

const TYPES = ['capability-map', 'system-landscape', 'solution-architecture', 'roadmap', 'process', 'data-model'];
const TYPE_ALIASES = {
  capability: 'capability-map', 'capability-map': 'capability-map',
  landscape: 'system-landscape', 'system-landscape': 'system-landscape',
  solution: 'solution-architecture', 'solution-architecture': 'solution-architecture',
  roadmap: 'roadmap',
  process: 'process', flow: 'process', interaction: 'process',
  'data-model': 'data-model', datamodel: 'data-model', erd: 'data-model',
};
const TYPE_LABEL = {
  'capability-map': 'Capability map', 'system-landscape': 'System landscape',
  'solution-architecture': 'Solution architecture', roadmap: 'Roadmap',
  process: 'Interaction / process flow', 'data-model': 'Data model',
};

// Salesforce colour system: every colour has a number from 0 (black) to 100 (white). Text and its
// background stay at least 50 points apart (WCAG 4.5:1). Greys 50, 80 and 90 are the published values.
const C = {
  navy: '#032d60', // blue 20: header title and description
  ink: '#181818', // grey 10: card titles, lines
  ink2: '#2e2e2e', // grey 20: attributes
  ink3: '#444444', // grey 30: secondary text
  grey50: '#747474', // card outline
  grey80: '#c9c9c9',
  grey90: '#e5e5e5', // header band, separator rule, footer band
  grey95: '#f3f3f3', // container fill
  external: '#d0d2dd', // external system card (system landscapes)
  white: '#ffffff',
};

// Change-status overlay (this kit's addition; the same palette as the Mermaid overlay).
const STATUS = {
  new: { label: 'New in this change', badge: 'NEW', fill: '#dcfce7', stroke: '#15803d', text: '#14532d', dash: '' },
  changed: { label: 'Changed by this change', badge: 'CHANGED', fill: '#fef3c7', stroke: '#b45309', text: '#78350f', dash: '6 3' },
  unchanged: { label: 'Unchanged (no badge)', badge: '', fill: '#f1f5f9', stroke: '#94a3b8', text: '#334155', dash: '' },
  removed: { label: 'Removed by this change', badge: 'REMOVED', fill: '#fee2e2', stroke: '#b91c1c', text: '#7f1d1d', dash: '2 2' },
};
const EDGE_PREFIX = { new: '[NEW] ', changed: '[CHG] ', removed: '[DEL] ', unchanged: '' };

// Connector kinds. Salesforce: "Line styles indicate a different type of connection and should be
// represented in your diagram key." Dashed kinds are animated: the dashes move in the direction of flow.
const KINDS = {
  sync: { label: 'Synchronous call (request and response)', color: '#032d60', width: 2, end: 'block' },
  async: { label: 'Asynchronous event or message', color: '#5a1ba9', width: 2, dash: '8 4', end: 'block', animate: true },
  data: { label: 'Data load, sync or batch', color: '#0b827c', width: 3, dash: '3 3', end: 'block', animate: true },
  user: { label: 'User interaction', color: '#444444', width: 2, end: 'open' },
  flow: { label: 'Next step', color: '#032d60', width: 2, end: 'block' },
  dependency: { label: 'Uses or depends on', color: '#5c5c5c', width: 1.5, end: 'block' },
  lookup: { label: 'Lookup (optional parent)', color: '#181818', width: 1.5, start: 'ERzeroToMany', end: 'ERzeroToOne', er: true },
  'lookup-required': { label: 'Lookup (required parent)', color: '#181818', width: 1.5, start: 'ERzeroToMany', end: 'ERmandOne', er: true },
  'master-detail': { label: 'Master-detail (diamond on the master)', color: '#181818', width: 1.5, start: 'ERzeroToMany', end: 'diamond', er: true },
  'many-to-many': { label: 'Many-to-many (junction object)', color: '#181818', width: 1.5, start: 'ERzeroToMany', end: 'ERzeroToMany', er: true },
};

// Data model notation: entity fill and border carry meaning; the focus cloud sets the colour.
const CLOUDS = {
  custom: ['#e6f4ff', '#0b5cab'], sales: ['#cff8f2', '#276663'], service: ['#f6d2de', '#8e2b4c'],
  platform: ['#dfdeee', '#463c6e'], industries: ['#efe8f0', '#744885'],
};
const ENTITIES = {
  cloud: 'Object of the cloud in focus',
  related: 'Related object (other licence)',
  extended: 'Related object extended by this cloud',
  external: 'External object (not stored in Salesforce)',
  'record-type': 'Record type of its parent',
  conceptual: 'Conceptual (no object or record type)',
};

// draw.io's built-in Salesforce shape library: name -> [width, height, [fillColor2, fillColor3, ...]].
// From the draw.io shape index (Apache-2.0). Names ending in 2 are white glyphs on a coloured circle,
// the form Salesforce uses for card and footer icons.
const SF_ICONS = {"sales":[60,60,["#04e1cb","#ffffff","#0b827c"]],"service":[60,49,["#e26e8c","#8a033e","#ffffff"]],"marketing":[60,60,["#dd7a01","#ffffff","#ffba90"]],"commerce":[60,53,["#41b658","#ffffff","#396547"]],"platform":[39,60,["#1b96ff","#ffffff","#014486"]],"analytics":[60,59,["#ffffff","#7f8de1","#3a49da"]],"integration":[60,60,["#ffffff","#fe9339","#ca2a2a"]],"employees":[58,60,["#ffffff","#06a59a","#056764"]],"learning":[60,60,["#ffffff","#cb65ff","#481a54"]],"industries":[53,60,["#ffffff","#7526e3","#3a049a"]],"partners":[60,60,["#ffffff","#cb65ff","#481a54"]],"success":[41,60,["#ffffff","#5867e8","#032d60"]],"inbox":[60,45,["#ffffff","#ff9a3c","#ca2a2a"]],"field_service":[45,60,["#ffffff","#ea001e","#8a033e"]],"iot":[60,60,["#ffffff","#1b96ff","#014486"]],"social_studio":[60,60,["#ffffff","#dd7a01","#ffba90"]],"customer_360":[60,55,["#ffffff","#1b96ff","#032d60","#5867e8","#d8e6fe","#04e1cb","#ffba90"]],"heroku":[60,60,["#ffffff","#7f8de1","#3a49da"]],"work_com":[60,59,["#ffffff","#1b96ff","#032d60"]],"loyalty":[60,41,["#ffffff","#5867e8","#032d60"]],"sales2":[60,60,["#0b827c","#ffffff"]],"service2":[60,60,["#8a033e","#ffffff"]],"marketing2":[60,60,["#dd7a01","#ffffff"]],"commerce2":[60,60,["#396547","#ffffff"]],"platform2":[60,60,["#014486","#ffffff"]],"analytics2":[60,60,["#3a49da","#ffffff"]],"integration2":[60,60,["#ca2a2a","#ffffff"]],"employees2":[60,60,["#056764","#ffffff"]],"learning2":[60,60,["#481a54","#ffffff"]],"industries2":[60,60,["#3a049a","#ffffff"]],"partners2":[60,60,["#481a54","#ffffff"]],"success2":[60,60,["#032d60","#ffffff"]],"inbox2":[60,60,["#ca2a2a","#ffffff"]],"field_service2":[60,60,["#8a033e","#ffffff"]],"iot2":[60,60,["#014486","#ffffff"]],"social_studio2":[60,60,["#dd7a01","#ffffff"]],"customer_3602":[60,60,["#032d60","#ffffff"]],"heroku2":[60,60,["#3a49da","#ffffff"]],"work_com2":[60,60,["#032d60","#ffffff"]],"loyalty2":[60,60,["#032d60","#ffffff"]],"apps":[34,60,["#ffffff","#5867e8","#032d60"]],"web":[60,47,["#ffffff","#5867e8","#032d60"]],"channels":[60,60,["#ffffff","#5867e8","#032d60"]],"bots":[60,57,["#ffffff","#5867e8","#032d60"]],"automation":[60,58,["#ffffff","#5867e8","#032d60"]],"workflow":[60,60,["#ffffff","#5867e8","#032d60"]],"personalization":[60,45,["#ffffff","#5867e8","#032d60"]],"builders":[55,60,["#ffffff","#5867e8","#032d60"]],"data":[49,60,["#ffffff","#5867e8","#032d60"]],"stream":[60,60,["#ffffff","#5867e8","#032d60"]],"segments":[60,60,["#ffffff","#5867e8","#032d60"]],"privacy":[46,60,["#ffffff","#5867e8","#032d60"]],"apps2":[60,60,["#032d60","#ffffff"]],"web2":[60,60,["#032d60","#ffffff"]],"channels2":[60,60,["#032d60","#ffffff"]],"bots2":[60,60,["#032d60","#ffffff"]],"automation2":[60,60,["#032d60","#ffffff"]],"workflow2":[60,60,["#032d60","#ffffff"]],"personalization2":[60,60,["#032d60","#ffffff"]],"builders2":[60,60,["#032d60","#ffffff"]],"data2":[60,60,["#032d60","#ffffff"]],"stream2":[60,60,["#032d60","#ffffff"]],"segments2":[60,60,["#032d60","#ffffff"]],"privacy2":[60,60,["#032d60","#ffffff"]],"government":[52,60,["#ffffff","#fe9339","#ca2a2a"]],"media":[60,60,["#ffffff","#fe9339","#ca2a2a"]],"consumer_goods":[54,60,["#ffffff","#fe9339","#ca2a2a"]],"transportation_and_technology":[60,60,["#ffffff","#fe9339","#ca2a2a"]],"financial_services":[58,60,["#ffffff","#fe9339","#ca2a2a"]],"automotive":[60,60,["#ffffff","#fe9339","#ca2a2a"]],"energy":[45,60,["#ffffff","#fe9339","#ca2a2a"]],"smb":[60,49,["#ffffff","#fe9339","#ca2a2a"]],"communications":[47,60,["#ffffff","#fe9339","#ca2a2a"]],"retail":[45,60,["#ffffff","#fe9339","#ca2a2a"]],"manufacturing":[60,60,["#ffffff","#fe9339","#ca2a2a"]],"health":[60,50,["#ffffff","#fe9339","#ca2a2a"]],"philantrophy":[50,60,["#ffffff","#fe9339","#ca2a2a"]],"non_profit":[60,56,["#ffffff","#fe9339","#ca2a2a"]],"education":[60,40,["#ffffff","#fe9339","#ca2a2a"]],"sustainability":[60,60,["#ffffff","#fe9339","#ca2a2a"]],"government2":[60,60,["#ca2a2a","#ffffff"]],"media2":[60,60,["#ca2a2a","#ffffff"]],"consumer_goods2":[60,60,["#ca2a2a","#ffffff"]],"transportation_and_technology2":[60,60,["#ca2a2a","#ffffff"]],"financial_services2":[60,60,["#ca2a2a","#ffffff"]],"automotive2":[60,60,["#ca2a2a","#ffffff"]],"energy2":[60,60,["#ca2a2a","#ffffff"]],"smb2":[60,60,["#ca2a2a","#ffffff"]],"communications2":[60,60,["#ca2a2a","#ffffff"]],"retail2":[60,60,["#ca2a2a","#ffffff"]],"manufacturing2":[60,60,["#ca2a2a","#ffffff"]],"health2":[60,60,["#ca2a2a","#ffffff"]],"philantrophy2":[60,60,["#ca2a2a","#ffffff"]],"non_profit2":[60,60,["#ca2a2a","#ffffff"]],"education2":[60,60,["#ca2a2a","#ffffff"]],"sustainability2":[60,60,["#ca2a2a","#ffffff"]]};

// Default icon per Metadata API type (or pseudo-type) when a card names none.
const TYPE_ICON = {
  FlexiPage: 'apps', LightningComponentBundle: 'apps', AuraDefinitionBundle: 'apps', ApexPage: 'web', Layout: 'apps',
  CustomApplication: 'apps', CustomTab: 'apps', QuickAction: 'apps', ExperienceBundle: 'web',
  ApexClass: 'builders', ApexTrigger: 'automation', Flow: 'workflow', ValidationRule: 'automation',
  ApprovalProcess: 'workflow', PlatformEventChannel: 'stream', CustomLabel: 'builders',
  CustomObject: 'data', CustomField: 'data', RecordType: 'data', CustomMetadata: 'data', GlobalValueSet: 'data',
  ReportType: 'analytics', Report: 'analytics', Dashboard: 'analytics',
  PermissionSet: 'privacy', PermissionSetGroup: 'privacy', CustomPermission: 'privacy', SharingRules: 'privacy', Profile: 'privacy',
  NamedCredential: 'integration', ExternalCredential: 'integration', ConnectedApp: 'integration',
  ExternalServiceRegistration: 'integration', RemoteSiteSetting: 'integration',
  Bot: 'bots', GenAiPlanner: 'bots', GenAiPlannerBundle: 'bots', GenAiPlugin: 'bots', GenAiFunction: 'bots',
  PlatformService: 'platform',
};

const TYPE_TITLE = {
  FlexiPage: 'Lightning page', LightningComponentBundle: 'Lightning web component', AuraDefinitionBundle: 'Aura component',
  ApexPage: 'Visualforce page', ApexClass: 'Apex class', ApexTrigger: 'Apex trigger', Flow: 'Flow',
  CustomObject: 'Object', CustomField: 'Field', CustomMetadata: 'Custom metadata', PermissionSet: 'Permission set',
  PermissionSetGroup: 'Permission set group', CustomPermission: 'Custom permission', NamedCredential: 'Named credential',
  ExternalCredential: 'External credential', ConnectedApp: 'Connected app', ExternalSystem: 'External system',
  PlatformService: 'Platform service', PlatformEventChannel: 'Platform event channel', ValidationRule: 'Validation rule',
  RecordType: 'Record type', QuickAction: 'Quick action', ExperienceBundle: 'Experience site',
};

const LAYERS = [
  ['ui', 'Experience', 'apps'], ['automation', 'Automation and logic', 'automation'], ['data', 'Data', 'data'],
  ['security', 'Security and access', 'privacy'], ['integration', 'Integration', 'integration'], ['external', 'External systems', ''],
];

// ------------------------------------------------------------------ geometry

const M = 40; // page margin
const GAP_X = 120; // corridor between columns: connectors route here
const GAP_Y = 32; // between stacked cards
const PAD = 20; // inside a container
const GROUP_TOP = 66; // container title, subtitle and rule
const ICON = 40; // card icon
const MAX_CARDS = 25;

// ------------------------------------------------------------------ helpers

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#xa;');
const html = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Escaped text that may wrap inside API names: after underscores and between camelCase words.
const soft = (s) => html(s).replace(/_(?=[A-Za-z0-9])/g, '_<wbr>').replace(/([a-z0-9])([A-Z])/g, '$1<wbr>$2');
const slug = (s) => String(s).replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
const lines = (text, width, px) => Math.max(1, Math.ceil((String(text).length * px) / Math.max(40, width)));
const r = (n) => Math.round(n * 10) / 10;
// Style string from an object. `true` writes a bare token (draw.io's `text;`, `swimlane;`).
const style = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => (v === true ? k : `${k}=${v}`)).join(';') + ';';
const TEXT = { text: true, html: 1, whiteSpace: 'wrap', strokeColor: 'none', fillColor: 'none', align: 'left', verticalAlign: 'top', spacing: 0, overflow: 'hidden' };

function normaliseType(t) {
  return TYPE_ALIASES[String(t || '').toLowerCase()] || null;
}

function iconStyle(name) {
  const icon = SF_ICONS[name];
  if (!icon) return null;
  const fills = icon[2];
  const o = { shape: `mxgraph.salesforce.${name}`, aspect: 'fixed', html: 1, fillColorStyles: fills.map((_, i) => `fillColor${i + 2}`).join(',') };
  fills.forEach((f, i) => { o[`fillColor${i + 2}`] = f; });
  return style({ ...o, fillColor: 'none', strokeColor: 'none', sfRole: 'icon' });
}

// The circle form of an icon (white glyph on a coloured circle) when draw.io has one.
const circled = (name) => (name && !/2$/.test(name) && SF_ICONS[`${name}2`] ? `${name}2` : name);

function fit(icon, box) {
  const [w, h] = SF_ICONS[icon];
  const k = box / Math.max(w, h);
  return [r(w * k), r(h * k)];
}

function iconFor(card, spec) {
  if (spec.icons === false || card.icon === false || card.icon === '') return null;
  if (card.icon) return SF_ICONS[card.icon] ? circled(card.icon) : null;
  if (spec.type === 'data-model') return null; // ERDs carry no icons unless asked
  const t = TYPE_ICON[card.metadataType];
  return t ? circled(t) : null;
}

// ------------------------------------------------------------------ validation

function validateSpec(spec) {
  const errors = [];
  const warnings = [];
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return { errors: ['the spec must be a JSON object'], warnings };
  const type = normaliseType(spec.type);
  if (!type) errors.push(`type must be one of: ${TYPES.join(', ')}`);
  if (!spec.title) errors.push('title is required (the header names the diagram)');
  if (!spec.description) errors.push('description is required (one sentence: the message the diagram gives)');
  if (spec.direction && !['LR', 'TB'].includes(spec.direction)) errors.push('direction must be LR or TB');
  if (spec.cloud && !CLOUDS[spec.cloud]) errors.push(`cloud must be one of: ${Object.keys(CLOUDS).join(', ')}`);
  const groups = Array.isArray(spec.groups) ? spec.groups : [];
  const lanes = Array.isArray(spec.lanes) ? spec.lanes : [];
  const cards = Array.isArray(spec.cards) ? spec.cards : [];
  const connectors = Array.isArray(spec.connectors) ? spec.connectors : [];
  if (!cards.length) errors.push('cards must list at least one card');
  const gIds = new Set();
  for (const g of groups) {
    if (!g.id) errors.push('every group needs an id');
    else if (gIds.has(g.id)) errors.push(`duplicate group id: ${g.id}`);
    gIds.add(g.id);
    if (g.icon && !SF_ICONS[g.icon]) errors.push(`group ${g.id}: unknown icon "${g.icon}"`);
  }
  const lIds = new Set(lanes.map((l) => l.id));
  for (const l of spec.legend || []) if (!SF_ICONS[l.icon]) errors.push(`legend: unknown icon "${l.icon}"`);
  if (type === 'roadmap' && !groups.length) errors.push('a roadmap needs groups: one per time period (quarter, month or release), in order');
  const cIds = new Set();
  for (const c of cards) {
    if (!c.id) { errors.push('every card needs an id'); continue; }
    if (cIds.has(c.id) || gIds.has(c.id)) errors.push(`duplicate id: ${c.id}`);
    cIds.add(c.id);
    if (!c.title) errors.push(`card ${c.id}: title is required`);
    if (c.status && !STATUS[c.status]) errors.push(`card ${c.id}: status must be new, changed, unchanged or removed`);
    if (groups.length && !gIds.has(c.group)) errors.push(`card ${c.id}: group "${c.group}" is not defined`);
    if (lanes.length && c.lane && !lIds.has(c.lane)) errors.push(`card ${c.id}: lane "${c.lane}" is not defined`);
    if (c.icon && !SF_ICONS[c.icon]) errors.push(`card ${c.id}: unknown icon "${c.icon}" (see the Salesforce icon list)`);
    for (const f of c.footerIcons || []) if (!SF_ICONS[f]) errors.push(`card ${c.id}: unknown footer icon "${f}"`);
    if (c.attributes && !Array.isArray(c.attributes)) errors.push(`card ${c.id}: attributes must be a list of strings`);
    if (c.entity && !ENTITIES[c.entity]) errors.push(`card ${c.id}: entity must be one of ${Object.keys(ENTITIES).join(', ')}`);
    if (c.span !== undefined && !(Number.isInteger(c.span) && c.span > 0)) errors.push(`card ${c.id}: span must be a whole number of periods`);
  }
  if (cards.length > MAX_CARDS && !spec.allowLarge) errors.push(`${cards.length} cards: at most ${MAX_CARDS} per diagram. Split by domain, layer or story and add an overview diagram.`);
  connectors.forEach((e, i) => {
    const where = `connector ${i + 1} (${e.from} -> ${e.to})`;
    if (!cIds.has(e.from)) errors.push(`${where}: from "${e.from}" is not a card id`);
    if (!cIds.has(e.to)) errors.push(`${where}: to "${e.to}" is not a card id`);
    if (e.kind && !KINDS[e.kind]) errors.push(`${where}: kind must be one of ${Object.keys(KINDS).join(', ')}`);
    if (e.status && !STATUS[e.status]) errors.push(`${where}: status must be new, changed, unchanged or removed`);
  });
  if (type === 'roadmap' && connectors.length) errors.push('roadmaps have no connectors: write dependencies on the card as an attribute ("Depends on: ...")');
  if (type === 'capability-map' && connectors.length) warnings.push('capability maps normally have no connectors');
  if (type === 'data-model' && connectors.some((e) => KINDS[e.kind] && !KINDS[e.kind].er)) warnings.push('data model connectors are normally lookup, lookup-required, master-detail or many-to-many');
  if (type !== 'data-model' && connectors.some((e) => KINDS[e.kind] && KINDS[e.kind].er)) warnings.push('relationship connectors belong in data model diagrams');
  if (String(spec.title || '').length > 60) warnings.push('title is long: Salesforce recommends a short title that can be read at a glance');
  if (String(spec.description || '').split(/[.!?](\s|$)/).filter((s) => s && s.trim()).length > 2) warnings.push('description is longer than one sentence: one message per diagram');
  return { errors, warnings };
}

// ------------------------------------------------------------------ cards

function badgeText(card) {
  const s = STATUS[card.status || 'unchanged'];
  if (!s || !s.badge) return '';
  return card.story ? `${s.badge} · ${card.story}` : s.badge;
}

function entityOf(card) {
  if (card.entity) return card.entity;
  const api = card.subtitle || card.title;
  return /__(c|mdt|e|b)$/.test(api) ? 'cloud' : (/__x$/.test(api) ? 'external' : 'related');
}

// Card anatomy (Salesforce kit of parts): icon, title (and subtitle), separator rule, attributes,
// footer band, footer icons. Returns the height and the child cells, positioned inside the card.
function cardModel(card, spec, W) {
  const dm = spec.type === 'data-model';
  const icon = iconFor(card, spec);
  const x0 = icon ? 14 + ICON + 12 : 16;
  const textW = W - x0 - 12;
  const titleH = lines(card.title, textW, 8.8) * 20;
  const subH = card.subtitle ? lines(card.subtitle, textW, 6.9) * 16 : 0;
  const headH = Math.max(icon ? ICON : 0, titleH + subH);
  const parts = [];
  let y = 14;
  if (icon) parts.push({ id: 'icon', st: iconStyle(icon), x: 14, y, w: fit(icon, ICON)[0], h: fit(icon, ICON)[1] });
  const removed = card.status === 'removed';
  const ent = dm ? entityOf(card) : null;
  const cloud = CLOUDS[spec.cloud || 'custom'];
  const titleColor = dm && (ent === 'cloud' || ent === 'record-type') ? cloud[1] : C.ink;
  let label = `<div style="font-size:15px;font-weight:bold;color:${titleColor};line-height:20px;overflow-wrap:anywhere">${removed ? `<s>${soft(card.title)}</s>` : soft(card.title)}</div>`;
  if (card.subtitle) {
    label += dm
      ? `<div style="font-size:12px;font-weight:bold;font-style:italic;color:${titleColor};line-height:16px;overflow-wrap:anywhere">${soft(card.subtitle)}</div>`
      : `<div style="font-size:12px;color:${C.ink3};line-height:16px">${soft(card.subtitle)}</div>`;
  }
  parts.push({ id: 'title', value: label, st: style({ ...TEXT, verticalAlign: 'middle' }), x: x0, y, w: textW, h: headH });
  y += headH + 8;
  parts.push({ id: 'rule', st: style({ rounded: 0, html: 1, fillColor: C.grey90, strokeColor: 'none' }), x: x0, y, w: W - x0 - 1.5, h: 3 });
  y += 3;
  const attrs = card.attributes || [];
  if (attrs.length) {
    const n = attrs.reduce((k, a) => k + lines(a, W - x0 - 12, 7), 0);
    parts.push({ id: 'attributes', value: attrs.map((a) => soft(a)).join('<br>'), st: style({ ...TEXT, fontSize: 12, fontColor: C.ink2 }), x: x0, y: y + 8, w: W - x0 - 12, h: n * 17 });
    y += 8 + n * 17;
  }
  const badge = badgeText(card);
  if (badge || card.footer) {
    y += 10;
    parts.push({ id: 'footer', st: style({ rounded: 1, arcSize: 18, absoluteArcSize: 1, html: 1, fillColor: C.grey90, strokeColor: 'none', sfRole: 'footer' }), x: 8, y, w: W - 16, h: 28 });
    let fx = 14;
    if (badge) {
      const st = STATUS[card.status];
      const bw = Math.ceil(badge.length * 6.6 + 20);
      parts.push({ id: 'status', value: badge, st: style({ rounded: 1, arcSize: 50, html: 1, fillColor: st.fill, strokeColor: st.stroke, fontColor: st.text, fontSize: 10, fontStyle: 1, align: 'center', verticalAlign: 'middle', sfRole: 'status' }), x: fx, y: y + 5, w: bw, h: 18 });
      fx += bw + 8;
    }
    if (card.footer) parts.push({ id: 'footer-text', value: html(card.footer), st: style({ ...TEXT, align: badge ? 'right' : 'center', verticalAlign: 'middle', fontSize: 11, fontColor: C.ink }), x: fx, y: y + 3, w: W - fx - 16, h: 22 });
    y += 28;
  }
  const fIcons = (card.footerIcons || []).filter((f) => SF_ICONS[f]);
  if (fIcons.length) {
    const sz = 24;
    const total = fIcons.length * sz + (fIcons.length - 1) * 8;
    let fx = (W - total) / 2;
    y += 6;
    fIcons.forEach((f, i) => {
      const ic = circled(f);
      parts.push({ id: `footer-icon-${i + 1}`, st: iconStyle(ic), x: fx, y, w: fit(ic, sz)[0], h: fit(ic, sz)[1] });
      fx += sz + 8;
    });
    y += sz;
  }
  y += 12;
  return { h: Math.ceil(Math.max(y, icon ? ICON + 28 : 0) / 2) * 2, parts };
}

function cardStyle(card, spec) {
  const st = STATUS[card.status];
  const base = { rounded: 1, arcSize: 14, absoluteArcSize: 1, whiteSpace: 'wrap', html: 1, container: 1, collapsible: 0, recursiveResize: 0, shadow: 1, sfRole: 'card', sfStatus: card.status };
  if (spec.type === 'data-model') {
    const ent = entityOf(card);
    const cloud = CLOUDS[spec.cloud || 'custom'];
    const e = {
      cloud: { fillColor: cloud[0], strokeColor: cloud[1], strokeWidth: 2 },
      related: { fillColor: C.white, strokeColor: C.ink, strokeWidth: 2 },
      extended: { fillColor: C.grey95, strokeColor: C.ink, strokeWidth: 2 },
      external: { fillColor: '#f7f9fb', strokeColor: 'none' },
      'record-type': { fillColor: cloud[0], strokeColor: cloud[1], strokeWidth: 2, dashed: 1, dashPattern: '8 4' },
      conceptual: { fillColor: C.white, strokeColor: C.ink3, strokeWidth: 2, dashed: 1, dashPattern: '1 3' },
    }[ent];
    return style({ ...base, ...e, sfEntity: ent });
  }
  const plain = card.status === 'unchanged';
  return style({
    ...base, fillColor: card.external ? C.external : C.white,
    strokeColor: plain ? C.grey50 : st.stroke, strokeWidth: plain ? 1.5 : 2.5, dashed: st.dash ? 1 : 0, dashPattern: st.dash || undefined,
  });
}

// ------------------------------------------------------------------ layout

// Within a column, put a card before the cards it points to and keep chains together, so most
// same-column connectors join neighbours. `"autoOrder": false` keeps the order as written.
function orderInGroup(list, spec) {
  if (spec.autoOrder === false || list.length < 3) return list;
  const ids = new Set(list.map((c) => c.id));
  const out = new Map(list.map((c) => [c.id, []]));
  const indeg = new Map(list.map((c) => [c.id, 0]));
  for (const e of spec.connectors || []) {
    if (ids.has(e.from) && ids.has(e.to) && e.from !== e.to) { out.get(e.from).push(e.to); indeg.set(e.to, indeg.get(e.to) + 1); }
  }
  const pos = new Map(list.map((c, i) => [c.id, i]));
  const done = new Set();
  const result = [];
  const visit = (id) => {
    if (done.has(id)) return;
    done.add(id);
    result.push(id);
    const next = out.get(id).filter((t) => !done.has(t)).sort((a, b) => pos.get(a) - pos.get(b));
    for (const t of next) {
      const preds = list.filter((c) => out.get(c.id).includes(t)).map((c) => c.id);
      if (preds.every((p) => done.has(p))) visit(t);
    }
  };
  for (const c of list) if (indeg.get(c.id) === 0) visit(c.id);
  for (const c of list) visit(c.id); // cycles
  const byId = new Map(list.map((c) => [c.id, c]));
  return result.map((id) => byId.get(id));
}

function defaultCardWidth(type) {
  return { 'capability-map': 230, 'data-model': 280, process: 240 }[type] || 280;
}

// Positions every group and card (absolute boxes; containers translate them to relative later).
function layout(spec) {
  const type = spec.type;
  if (type === 'roadmap') return layoutRoadmap(spec);
  const dir = spec.direction || (type === 'capability-map' ? 'TB' : 'LR');
  const cardW = spec.cardWidth || defaultCardWidth(type);
  const cards = spec.cards;
  const models = new Map(cards.map((c) => [c.id, cardModel(c, spec, cardW)]));
  const size = new Map(cards.map((c) => [c.id, { w: cardW, h: models.get(c.id).h }]));
  let groups = Array.isArray(spec.groups) && spec.groups.length ? spec.groups.map((g) => ({ ...g })) : null;
  const implicit = !groups;
  const owner = new Map();
  if (implicit) {
    // No groups: a grid of invisible columns.
    const cols = spec.columns || Math.min(4, Math.max(1, Math.ceil(Math.sqrt(cards.length))));
    const perCol = Math.ceil(cards.length / cols);
    groups = Array.from({ length: cols }, (_, i) => ({ id: `__col${i}`, label: '', hidden: true }));
    cards.forEach((c, i) => owner.set(c.id, `__col${Math.floor(i / perCol)}`));
  } else cards.forEach((c) => owner.set(c.id, c.group));
  const members = new Map(groups.map((g) => [g.id, orderInGroup(cards.filter((c) => owner.get(c.id) === g.id), spec)]));
  const boxes = new Map();
  if (type === 'process') return { ...layoutLanes(spec, groups, members, size, cardW, boxes), models };

  const gapIn = GAP_X * 0.5;
  const inner = new Map();
  for (const g of groups) {
    const list = members.get(g.id);
    const cols = g.columns || (dir === 'TB' ? Math.min(Math.max(list.length, 1), spec.maxPerRow || 5) : 1);
    const rows = [];
    list.forEach((c, i) => { const k = Math.floor(i / cols); (rows[k] = rows[k] || []).push(c); });
    const rowH = rows.map((row) => Math.max(...row.map((c) => size.get(c.id).h)));
    const top = g.hidden ? 0 : GROUP_TOP;
    const pad = g.hidden ? 0 : PAD;
    const w = cols * cardW + (cols - 1) * gapIn + 2 * pad;
    const h = top + rowH.reduce((a, b) => a + b, 0) + Math.max(0, rows.length - 1) * GAP_Y + pad;
    inner.set(g.id, { rows, rowH, w: Math.max(w, g.hidden ? 0 : 220), h: Math.max(h, g.hidden ? 0 : 120), top });
  }
  const perRow = dir === 'TB' ? 1 : (implicit ? groups.length : (spec.columns || groups.length));
  const placed = [];
  for (let i = 0; i < groups.length; i += perRow) placed.push(groups.slice(i, i + perRow));
  const colW = [];
  placed.forEach((row) => row.forEach((g, j) => { colW[j] = Math.max(colW[j] || 0, inner.get(g.id).w); }));
  const fullW = Math.max(...groups.map((g) => inner.get(g.id).w));
  let y = 0;
  for (const row of placed) {
    const rowH = Math.max(...row.map((g) => inner.get(g.id).h));
    let x = 0;
    row.forEach((g, j) => {
      const inn = inner.get(g.id);
      const w = dir === 'TB' ? fullW : colW[j];
      const h = dir === 'TB' ? inn.h : rowH;
      boxes.set(g.id, { x, y, w, h, group: true, hidden: g.hidden });
      let cy = y + inn.top;
      inn.rows.forEach((cardsInRow, ri) => {
        const span = cardsInRow.length * cardW + (cardsInRow.length - 1) * gapIn;
        let cx = x + (dir === 'TB' ? PAD : (w - span) / 2);
        for (const c of cardsInRow) {
          boxes.set(c.id, { x: cx, y: cy, w: cardW, h: size.get(c.id).h, parent: g.hidden ? null : g.id });
          cx += cardW + gapIn;
        }
        cy += inn.rowH[ri] + GAP_Y;
      });
      x += w + corridorWidth(spec);
    });
    y += Math.max(...row.map((g) => boxes.get(g.id).h)) + GAP_Y + 8;
  }
  return { boxes, groups, models };
}

// Process diagrams: one horizontal lane per actor or system; numbered steps advance left to right.
function layoutLanes(spec, groups, members, size, cardW, boxes) {
  const LANE_LABEL = 44;
  const step = new Map();
  spec.cards.forEach((c, i) => step.set(c.id, Number.isInteger(c.step) ? c.step : i));
  const maxStep = Math.max(...spec.cards.map((c) => step.get(c.id)));
  const colX = (s) => LANE_LABEL + PAD + s * (cardW + Math.max(GAP_X * 0.75, corridorWidth(spec) - 40));
  const width = colX(maxStep) + cardW + PAD;
  let y = 0;
  for (const g of groups) {
    const list = members.get(g.id);
    const stacks = new Map();
    for (const c of list) { const s = step.get(c.id); stacks.set(s, [...(stacks.get(s) || []), c]); }
    const laneH = Math.max(130, ...[...stacks.values()].map((st) => st.reduce((a, c) => a + size.get(c.id).h, 0) + (st.length - 1) * GAP_Y + 2 * PAD));
    boxes.set(g.id, { x: 0, y, w: width, h: laneH, group: true, lane: true, hidden: g.hidden });
    for (const [s, st] of stacks) {
      const total = st.reduce((a, c) => a + size.get(c.id).h, 0) + (st.length - 1) * GAP_Y;
      let cy = y + (laneH - total) / 2;
      for (const c of st) {
        boxes.set(c.id, { x: colX(s), y: cy, w: cardW, h: size.get(c.id).h, parent: g.hidden ? null : g.id });
        cy += size.get(c.id).h + GAP_Y;
      }
    }
    y += laneH;
  }
  return { boxes, groups, lanes: true };
}

// Roadmaps: a time grid. Columns are periods (the groups), rows are swimlanes (`lanes`); a card's
// left and right edges sit on its first and last period (`group` and `span`). No connectors.
function layoutRoadmap(spec) {
  const periods = spec.groups;
  const lanes = spec.lanes && spec.lanes.length ? spec.lanes : [{ id: '__all', label: '' }];
  const PW = spec.periodWidth || 250;
  const LABEL_W = lanes.some((l) => l.label) ? 170 : 0;
  const HEAD = 62;
  const idx = new Map(periods.map((p, i) => [p.id, i]));
  const models = new Map();
  const boxes = new Map();
  const extras = [];
  let y = HEAD;
  const laneBoxes = [];
  for (const lane of lanes) {
    const list = spec.cards.filter((c) => (c.lane || lanes[0].id) === lane.id);
    const rows = [];
    for (const c of list) {
      const s = idx.get(c.group);
      const e = s + (c.span || 1) - 1;
      let row = rows.findIndex((rw) => rw.every((o) => o.e < s || o.s > e));
      if (row < 0) { rows.push([]); row = rows.length - 1; }
      const w = (c.span || 1) * PW - 20;
      const m = cardModel(c, spec, w);
      models.set(c.id, m);
      rows[row].push({ c, s, e, w, h: m.h });
    }
    const top = y + 18;
    let cy = top;
    for (const rw of rows) {
      const h = Math.max(...rw.map((o) => o.h));
      for (const o of rw) boxes.set(o.c.id, { x: LABEL_W + o.s * PW + 10, y: cy, w: o.w, h: o.h, parent: null });
      cy += h + 16;
    }
    const laneH = Math.max(110, cy - y + 2);
    laneBoxes.push({ lane, y, h: laneH });
    y += laneH;
  }
  const W = LABEL_W + periods.length * PW;
  extras.push({ id: 'roadmap-frame', st: style({ rounded: 1, arcSize: 16, absoluteArcSize: 1, html: 1, fillColor: C.white, strokeColor: C.grey80, strokeWidth: 2, sfRole: 'frame' }), x: -10, y: 0, w: W + 20, h: y + 10 });
  periods.forEach((p, i) => {
    const x = LABEL_W + i * PW;
    if (i % 2 === 1) extras.push({ id: `period-${slug(p.id)}-shade`, st: style({ rounded: 0, html: 1, fillColor: '#f4f5f7', strokeColor: 'none' }), x, y: 4, w: PW, h: y - 4 });
    extras.push({ id: `period-${slug(p.id)}-line`, st: style({ rounded: 0, html: 1, fillColor: '#9a9a9a', strokeColor: 'none' }), x, y: 10, w: 1, h: y - 10 });
    const sub = p.subtitle ? `<div style="font-size:12px;color:${C.ink3};line-height:16px">${html(p.subtitle)}</div>` : '';
    extras.push({ id: `period-${slug(p.id)}`, value: `<div style="font-size:15px;font-weight:bold;color:${C.navy};line-height:20px">${html(p.label || p.id)}</div>${sub}`, st: style({ ...TEXT, sfRole: 'period' }), x: x + 12, y: 12, w: PW - 24, h: HEAD - 16 });
  });
  extras.push({ id: 'roadmap-head-rule', st: style({ rounded: 0, html: 1, fillColor: C.grey80, strokeColor: 'none' }), x: 0, y: HEAD - 2, w: W, h: 2 });
  for (const lb of laneBoxes) {
    if (lb.y > HEAD) extras.push({ id: `lane-${slug(lb.lane.id)}-rule`, st: style({ rounded: 0, html: 1, fillColor: C.grey80, strokeColor: 'none' }), x: 0, y: lb.y, w: W, h: 1 });
    if (LABEL_W) extras.push({ id: `lane-${slug(lb.lane.id)}`, value: `<b>${html(lb.lane.label || '')}</b>`, st: style({ ...TEXT, verticalAlign: 'middle', fontSize: 15, fontColor: C.ink3, sfRole: 'lane' }), x: 14, y: lb.y + 8, w: LABEL_W - 24, h: lb.h - 16 });
  }
  return { boxes, groups: [], models, extras, width: W + 10, height: y + 10, roadmap: true };
}

// Chooses the side each connector leaves and enters, spreads connectors that share a side, gives
// each its own channel in the corridor, and sends same-column connectors that would cross a card
// round the column's right side.
function ports(spec, boxes, ox = 0, oy = 0) {
  const ends = [];
  const center = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const cardBoxes = spec.cards.map((c) => boxes.get(c.id));
  const route = [];
  spec.connectors.forEach((e, i) => {
    const a = boxes.get(e.from);
    const b = boxes.get(e.to);
    let out;
    let inn;
    let detour = false;
    const xOverlap = a.x < b.x + b.w && b.x < a.x + a.w;
    if (!xOverlap) { out = b.x > a.x ? 'right' : 'left'; inn = out === 'right' ? 'left' : 'right'; }
    else {
      const lo = Math.min(a.y + a.h, b.y + b.h);
      const hi = Math.max(a.y, b.y);
      detour = cardBoxes.some((c) => c !== a && c !== b && c.x < Math.max(a.x + a.w, b.x + b.w) && Math.min(a.x, b.x) < c.x + c.w && c.y < hi && c.y + c.h > lo);
      if (detour) { out = 'right'; inn = 'right'; } else { out = b.y > a.y ? 'bottom' : 'top'; inn = out === 'bottom' ? 'top' : 'bottom'; }
    }
    route[i] = { a, b, out, detour };
    ends.push({ i, cell: e.from, side: out, other: center(b), role: 'exit' });
    ends.push({ i, cell: e.to, side: inn, other: center(a), role: 'entry' });
  });
  const bySide = new Map();
  for (const end of ends) { const k = `${end.cell}|${end.side}`; bySide.set(k, [...(bySide.get(k) || []), end]); }
  const result = spec.connectors.map(() => ({}));
  for (const list of bySide.values()) {
    const vertical = list[0].side === 'left' || list[0].side === 'right';
    list.sort((p, q) => (vertical ? p.other.y - q.other.y : p.other.x - q.other.x));
    list.forEach((end, k) => {
      const f = Math.round(((k + 1) / (list.length + 1)) * 1000) / 1000;
      const [x, y] = { left: [0, f], right: [1, f], top: [f, 0], bottom: [f, 1] }[end.side];
      result[end.i][end.role] = { x, y };
    });
  }
  // Vertical runs live in corridors (the gaps between columns). A connector whose horizontal run would
  // cross a card in a column it skips takes the highway: down its first corridor, along a lane below
  // the skipped columns' cards, and up its last corridor.
  const corridors = new Map();
  const segs = route.map(() => []);
  const highways = [];
  const addSeg = (i, seg, x0, x1, y1, y2) => {
    const key = `${Math.round(x0)}-${Math.round(x1)}`;
    const item = { i, seg, x0, x1, y1, y2 };
    corridors.set(key, [...(corridors.get(key) || []), item]);
    segs[i].push(item);
  };
  route.forEach((rt, i) => {
    const { a, b, out, detour } = rt;
    const p = result[i];
    if (!p.exit || !p.entry) return;
    const y1 = a.y + a.h * p.exit.y;
    const y2 = b.y + b.h * p.entry.y;
    if (detour) {
      const x = Math.max(a.x + a.w, b.x + b.w);
      addSeg(i, 'only', x, x + PAD + 4, y1, y2);
      return;
    }
    if (out !== 'left' && out !== 'right') return;
    const right = out === 'right';
    const lo = right ? a.x + a.w : b.x + b.w;
    const hi = right ? b.x : a.x;
    const between = cardBoxes.filter((c) => c !== a && c !== b && c.x >= lo - 1 && c.x + c.w <= hi + 1);
    // The vertical run sits in the corridor next to the source; the run at y2 crosses the skipped columns.
    const blocked = between.some((c) => c.y - 8 < y2 && c.y + c.h + 8 > y2);
    const firstGapEnd = between.length ? Math.min(...between.map((c) => c.x)) : hi;
    const lastGapStart = between.length ? Math.max(...between.map((c) => c.x + c.w)) : lo;
    if (!between.length || !blocked) {
      if (Math.abs(y1 - y2) < 1) return;
      if (right) addSeg(i, 'only', lo, firstGapEnd, y1, y2); else addSeg(i, 'only', lastGapStart, hi, y1, y2);
      return;
    }
    const floor = Math.max(...between.map((c) => c.y + c.h));
    const h = { i, floor, xa: lo, xb: hi };
    highways.push(h);
    if (right) { addSeg(i, 'a', lo, firstGapEnd, y1, null); addSeg(i, 'b', lastGapStart, hi, null, y2); }
    else { addSeg(i, 'a', lastGapStart, hi, y1, null); addSeg(i, 'b', lo, firstGapEnd, null, y2); }
  });
  // Highway lanes: stacked under the lowest skipped card.
  const lane = new Map();
  highways.sort((p, q) => p.floor - q.floor).forEach((h, k) => lane.set(h.i, h.floor + 22 + k * 16));
  for (const list of corridors.values()) {
    const yOf = (it) => (it.y1 == null ? lane.get(it.i) : it.y1);
    list.sort((p, q) => yOf(p) - yOf(q));
    const n = list.length;
    list.forEach((it, k) => {
      it.x = it.x0 + (it.x1 - it.x0) * (n === 1 ? 0.5 : 0.25 + (0.5 * k) / (n - 1));
      // Connectors sharing a corridor get their pills at staggered points so the pills do not stack.
      // Each gets its own height: the k-th of n sits at (k+1)/(n+1) down the corridor, whichever way it runs.
      if (n > 1 && result[it.i].labelX === undefined && it.y1 != null && it.y2 != null) {
        const f = (k + 1) / (n + 1);
        result[it.i].labelX = r((it.y2 > it.y1 ? 2 * f - 1 : 1 - 2 * f) * 0.8);
      }
    });
  }
  let floorNeeded = 0;
  segs.forEach((list, i) => {
    if (!list.length) return;
    const P = (x, y) => ({ x: r(ox + x), y: r(oy + y) });
    if (list.length === 1) { const s = list[0]; result[i].points = [P(s.x, s.y1), P(s.x, s.y2)]; return; }
    const [sa, sb] = [list.find((s) => s.seg === 'a'), list.find((s) => s.seg === 'b')];
    const hy = lane.get(i);
    floorNeeded = Math.max(floorNeeded, hy + 18);
    result[i].points = [P(sa.x, sa.y1), P(sa.x, hy), P(sb.x, hy), P(sb.x, sb.y2)];
    result[i].highway = true;
  });
  result.floorNeeded = floorNeeded;
  return result;
}

// Corridor width: wide enough for the longest pill that sits in it.
function corridorWidth(spec) {
  const longest = Math.max(0, ...(spec.connectors || []).map((e) => (e.label ? String(e.label).length + 8 : 0)));
  return Math.max(GAP_X, Math.min(240, Math.round(longest * 6.8 + 60)));
}

// ------------------------------------------------------------------ connectors

function defaultKind(type) {
  if (type === 'process') return 'flow';
  if (type === 'data-model') return 'lookup';
  if (type === 'system-landscape') return 'sync';
  return 'dependency';
}

function edgeStatus(spec, e) {
  const s = (id) => (spec.cards.find((c) => c.id === id) || {}).status || 'unchanged';
  const a = s(e.from);
  const b = s(e.to);
  if (a === 'removed' || b === 'removed') return 'removed';
  if (a === 'new' || b === 'new') return 'new';
  return 'unchanged';
}

function edgeStyle(kind, status, opts = {}) {
  const k = KINDS[kind];
  const removed = status === 'removed';
  const anim = opts.animate !== false && k.animate && !removed;
  // Data models: relationships this change adds are drawn in the focus-cloud colour, others black.
  const color = removed ? STATUS.removed.stroke : (k.er && status === 'new' && opts.cloud ? CLOUDS[opts.cloud][1] : k.color);
  return style({
    edgeStyle: 'orthogonalEdgeStyle', rounded: k.er ? 0 : 1, orthogonalLoop: 1, jettySize: 'auto', html: 1,
    strokeColor: color, strokeWidth: status === 'new' || status === 'changed' ? k.width + 1 : k.width,
    dashed: removed || k.dash ? 1 : 0, dashPattern: removed ? STATUS.removed.dash : k.dash,
    flowAnimation: anim ? 1 : undefined,
    endArrow: k.end, endFill: k.er ? 0 : 1, endSize: k.er ? 12 : 8,
    startArrow: opts.both ? k.end : (k.start || 'none'), startFill: opts.both ? 1 : 0, startSize: k.er ? 12 : 8,
    labelBackgroundColor: 'none', fontSize: 11,
    sfRole: 'connector', sfKind: kind, sfStatus: status,
  });
}

// Pills: capsule labels with a white fill and the connector's colour and line style.
function pill(text, kind, status) {
  const k = KINDS[kind];
  const color = status === 'removed' ? STATUS.removed.stroke : k.color;
  const dashed = k.dash || status === 'removed' ? 'dashed' : 'solid';
  return `<div style="display:inline-block;background:#ffffff;border:2px ${dashed} ${color};border-radius:12px;padding:2px 10px;font-weight:bold;color:${C.ink};font-size:11px;line-height:15px;white-space:nowrap">${html(text)}</div>`;
}

// ------------------------------------------------------------------ the document

function prepare(input) {
  const spec = JSON.parse(JSON.stringify(input));
  spec.type = normaliseType(spec.type);
  spec.cards = spec.cards || [];
  spec.connectors = spec.connectors || [];
  spec.cards.forEach((c) => { c.status = c.status || 'unchanged'; });
  return spec;
}

function keySections(spec) {
  const sections = [];
  const statuses = new Set(spec.cards.map((c) => c.status));
  const showStatus = spec.showStatus === true || (spec.showStatus !== false && [...statuses].some((s) => s !== 'unchanged'));
  if (showStatus) sections.push(['new', 'changed', 'unchanged', 'removed'].map((s) => ({ kind: 'status', s, label: STATUS[s].label })));
  if (spec.type === 'data-model') {
    const ents = [...new Set(spec.cards.map(entityOf))];
    if (ents.length > 1 || ents[0] !== 'related') sections.push(ents.map((e) => ({ kind: 'entity', e, label: ENTITIES[e] })));
  } else if (spec.cards.some((c) => c.external)) {
    sections.push([{ kind: 'system', external: false, label: 'Salesforce system' }, { kind: 'system', external: true, label: 'External system' }]);
  }
  const kinds = [...new Set(spec.connectors.map((e) => e.kind || defaultKind(spec.type)))];
  if (kinds.length) sections.push(kinds.map((k) => ({ kind: 'line', k, label: KINDS[k].label + (KINDS[k].animate && spec.animate !== false ? ' (animated)' : '') })));
  if (spec.legend && spec.legend.length) sections.push(spec.legend.map((l) => ({ kind: 'icon', icon: l.icon, label: l.label })));
  // Even rows: wrap long sections into columns of at most five rows.
  const columns = [];
  for (const sec of sections) for (let i = 0; i < sec.length; i += 5) columns.push(sec.slice(i, i + 5));
  return columns;
}

function toDrawio(input) {
  const spec = prepare(input);
  const { errors } = validateSpec(spec);
  if (errors.length) throw new Error(`diagram spec is invalid:\n- ${errors.join('\n- ')}`);
  const lay = layout(spec);
  const { boxes, models } = lay;
  // Highways run below the cards: deepen the containers they pass through.
  const floor = ports(spec, boxes).floorNeeded;
  if (floor) for (const b of boxes.values()) if (b.group && !b.hidden && b.y + b.h < floor) b.h = floor - b.y;

  // Key layout.
  const keyCols = keySections(spec);
  const colWidth = (col) => Math.min(300, 70 + Math.max(...col.map((row) => row.label.length)) * 6.4);
  const keyColW = keyCols.map(colWidth);
  const keyRows = Math.max(0, ...keyCols.map((c) => c.length));
  const keyW = keyCols.length ? keyColW.reduce((a, b) => a + b, 0) + 28 : 0;
  const keyH = keyRows ? 40 + keyRows * 24 : 0;

  // Content extent.
  let maxX = lay.width || 0;
  let maxY = lay.height || 0;
  for (const b of boxes.values()) { maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h); }
  const width = Math.max(maxX, keyW + 680, 900);
  const panelW = keyW ? width - keyW - 60 : Math.max(680, width * 0.62);
  const textW = Math.min(panelW - 110, 620);
  const authorH = spec.author ? 22 : 0;
  const titleLines = lines(spec.title, textW, 15.5);
  const descLines = lines(spec.description, textW, 8.2);
  const textH = authorH + titleLines * 38 + 10 + descLines * 22 + 30;
  let headerH = Math.max(150, textH + 44, keyH + 44);
  headerH = Math.max(headerH, Math.ceil(0.1 * (headerH + 40 + maxY)));
  const top = M + headerH + (lay.roadmap ? 30 : 48);

  const cells = [];
  const add = (xml) => cells.push(xml);
  const vertex = (id, value, st, parent, x, y, w, h) => add(`<mxCell id="${esc(id)}" value="${esc(value)}" style="${esc(st)}" vertex="1" parent="${esc(parent)}"><mxGeometry x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" as="geometry"/></mxCell>`);

  // Header: grey band, white panel with a convex right edge holding title and description, key on the right.
  vertex('header', '', style({ rounded: 0, html: 1, fillColor: C.grey90, strokeColor: 'none', container: 1, collapsible: 0, sfRole: 'header' }), '1', M, M, width, headerH);
  vertex('header-panel', '', style({ shape: 'delay', html: 1, fillColor: C.white, strokeColor: 'none', sfRole: 'decoration' }), 'header', 0, 0, panelW, headerH);
  const meta = [TYPE_LABEL[spec.type], spec.scope ? `Scope: ${spec.scope}` : '', spec.version ? `Version ${spec.version}` : '', spec.source ? `Source: ${spec.source}` : ''].filter(Boolean).join('   ·   ');
  const headerText = (spec.author ? `<div style="font-size:12px;font-weight:bold;color:${C.ink3};letter-spacing:1px;line-height:18px;margin-bottom:4px">${html(String(spec.author).toUpperCase())}</div>` : '')
    + `<div style="font-size:30px;color:${C.navy};line-height:38px">${html(spec.title)}</div>`
    + `<div style="font-size:15px;color:${C.navy};line-height:22px;margin-top:10px">${html(spec.description)}</div>`
    + `<div style="font-size:11px;color:${C.ink3};line-height:16px;margin-top:12px">${html(meta)}</div>`;
  vertex('header-title', headerText, style({ ...TEXT, verticalAlign: 'middle', sfRole: 'title' }), 'header', 44, 18, textW, headerH - 36);
  if (keyCols.length) {
    const kx = width - keyW - 24;
    const ky = (headerH - keyH) / 2;
    vertex('key', '', style({ rounded: 1, arcSize: 14, absoluteArcSize: 1, html: 1, fillColor: C.white, strokeColor: 'none', container: 1, collapsible: 0, sfRole: 'key' }), 'header', kx, ky, keyW, keyH);
    vertex('key-title', '<b>Key</b>', style({ ...TEXT, fontSize: 13, fontColor: C.ink }), 'key', 14, 10, 80, 18);
    let cx = 14;
    keyCols.forEach((col, ci) => {
      col.forEach((row, ri) => {
        const y = 36 + ri * 24;
        const id = `key-${ci + 1}-${ri + 1}`;
        if (row.kind === 'status') {
          const st = STATUS[row.s];
          vertex(id, '', style({ rounded: 1, arcSize: 6, absoluteArcSize: 1, html: 1, fillColor: C.white, strokeColor: row.s === 'unchanged' ? C.grey50 : st.stroke, strokeWidth: row.s === 'unchanged' ? 1.5 : 2.5, dashed: st.dash ? 1 : 0, dashPattern: st.dash || undefined }), 'key', cx, y + 2, 34, 16);
        } else if (row.kind === 'system') {
          vertex(id, '', style({ rounded: 1, arcSize: 6, absoluteArcSize: 1, html: 1, fillColor: row.external ? C.external : C.white, strokeColor: C.grey50, strokeWidth: 1.5 }), 'key', cx, y + 2, 34, 16);
        } else if (row.kind === 'entity') {
          const fake = { status: 'unchanged', entity: row.e, title: '' };
          vertex(id, '', cardStyle(fake, spec).replace(/shadow=1;|container=1;|sfRole=card;|sfStatus=unchanged;/g, ''), 'key', cx, y + 2, 34, 16);
        } else if (row.kind === 'line') {
          const ly = y + 10;
          add(`<mxCell id="${id}" value="" style="${esc(edgeStyle(row.k, 'unchanged', { animate: spec.animate, cloud: spec.cloud }))}" edge="1" parent="key"><mxGeometry relative="1" as="geometry"><mxPoint x="${cx}" y="${ly}" as="sourcePoint"/><mxPoint x="${cx + 40}" y="${ly}" as="targetPoint"/></mxGeometry></mxCell>`);
        } else if (row.kind === 'icon') {
          const ic = circled(row.icon);
          vertex(id, '', iconStyle(ic), 'key', cx + 7, y, ...fit(ic, 20));
        }
        vertex(`${id}-label`, html(row.label), style({ ...TEXT, verticalAlign: 'middle', fontSize: 12, fontColor: C.ink2 }), 'key', cx + 48, y, keyColW[ci] - 56, 20);
      });
      cx += keyColW[ci];
    });
  }

  // Roadmap grid.
  for (const x of lay.extras || []) vertex(x.id, x.value || '', x.st, '1', M + x.x, top + x.y, x.w, x.h);

  // Containers (groups) and lanes.
  for (const g of lay.groups) {
    const b = boxes.get(g.id);
    if (!b || b.hidden) continue;
    const gid = `group-${slug(g.id)}`;
    if (b.lane) {
      vertex(gid, `<b>${html(g.label || g.id)}</b>`, style({ swimlane: true, horizontal: 0, startSize: 44, html: 1, whiteSpace: 'wrap', fillColor: C.grey90, swimlaneFillColor: C.white, strokeColor: C.grey80, strokeWidth: 1.5, fontColor: C.navy, fontSize: 14, collapsible: 0, sfRole: 'group' }), '1', M + b.x, top + b.y, b.w, b.h);
      continue;
    }
    const icon = g.icon && SF_ICONS[g.icon] ? circled(g.icon) : null;
    vertex(gid, '', style({ rounded: 1, arcSize: 18, absoluteArcSize: 1, html: 1, fillColor: C.grey95, strokeColor: C.ink3, strokeWidth: 2.5, container: 1, collapsible: 0, recursiveResize: 0, sfRole: 'group' }), '1', M + b.x, top + b.y, b.w, b.h);
    const gx = icon ? 14 + 34 + 12 : 18;
    if (icon) vertex(`${gid}-icon`, '', iconStyle(icon), gid, 14, 13, ...fit(icon, 34));
    const sub = g.subtitle ? `<div style="font-size:12px;color:${C.ink3};line-height:16px">${html(g.subtitle)}</div>` : '';
    vertex(`${gid}-title`, `<div style="font-size:16px;font-weight:bold;color:${C.navy};line-height:21px">${html(g.label || g.id)}</div>${sub}`, style({ ...TEXT, verticalAlign: 'middle' }), gid, gx, 10, b.w - gx - 14, 40);
    vertex(`${gid}-rule`, '', style({ rounded: 0, html: 1, fillColor: C.grey80, strokeColor: 'none' }), gid, gx, 54, b.w - gx - 2, 3);
  }

  // Cards.
  for (const c of spec.cards) {
    const b = boxes.get(c.id);
    const parent = b.parent ? `group-${slug(b.parent)}` : '1';
    const pb = b.parent ? boxes.get(b.parent) : { x: -M, y: -top };
    const cid = `card-${slug(c.id)}`;
    vertex(cid, '', cardStyle(c, spec), parent, b.x - pb.x, b.y - pb.y, b.w, b.h);
    for (const p of models.get(c.id).parts) vertex(`${cid}-${p.id}`, p.value || '', p.st, cid, p.x, p.y, p.w, p.h);
  }

  // Connectors (process steps are numbered).
  const pin = ports(spec, boxes, M, top);
  spec.connectors.forEach((e, i) => {
    const kind = e.kind || defaultKind(spec.type);
    const status = e.status || edgeStatus(spec, e);
    const p = pin[i];
    const extra = p.exit && p.entry ? `exitX=${p.exit.x};exitY=${p.exit.y};exitDx=0;exitDy=0;entryX=${p.entry.x};entryY=${p.entry.y};entryDx=0;entryDy=0;` : '';
    const number = spec.type === 'process' || spec.numbered ? `${i + 1}. ` : '';
    const text = e.label ? `${number}${EDGE_PREFIX[status]}${e.label}` : (number ? number.trim() : '');
    const value = text ? pill(text, kind, status) : '';
    const pts = p.points ? `<Array as="points">${p.points.map((q) => `<mxPoint x="${q.x}" y="${q.y}"/>`).join('')}</Array>` : '';
    const st = edgeStyle(kind, status, { animate: spec.animate, cloud: spec.cloud, both: e.bidirectional }) + extra;
    add(`<mxCell id="edge-${i + 1}" value="${esc(value)}" style="${esc(st)}" edge="1" parent="1" source="card-${esc(slug(e.from))}" target="card-${esc(slug(e.to))}"><mxGeometry relative="1"${p.labelX !== undefined && text ? ` x="${p.labelX}"` : ''} as="geometry">${pts}</mxGeometry></mxCell>`);
  });

  const pageW = Math.ceil(M * 2 + width);
  const pageH = Math.ceil(top + maxY + M);
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="sf-sdlc" type="device">
  <diagram id="${esc(slug(spec.id || spec.title))}" name="${esc(TYPE_LABEL[spec.type])}">
    <mxGraphModel dx="${pageW}" dy="${pageH}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageW}" pageHeight="${pageH}" background="#ffffff" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cells.join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;
}

// ------------------------------------------------------------------ from the component model

const hasStory = (entry, story) => String(entry.story || '').split(',').map((s) => s.trim()).includes(story);
const CHILD_TYPES = ['CustomField', 'RecordType', 'ValidationRule', 'BusinessProcess', 'ListView', 'FieldSet', 'CompactLayout'];

// Builds a solution-architecture or data-model spec from docs/sdlc/03-architecture/components.json.
function specFromComponents(components, opts = {}) {
  if (!Array.isArray(components)) throw new Error('components.json must be a JSON array');
  const type = normaliseType(opts.type || 'solution-architecture');
  if (!['solution-architecture', 'data-model'].includes(type)) throw new Error('only solution-architecture and data-model can be generated from components.json; write a spec for the other types');
  const byName = new Map(components.map((c) => [c.apiName, c]));
  const isChild = (c) => CHILD_TYPES.includes(c.type) && c.apiName.includes('.') && byName.has(c.apiName.split('.')[0]);
  const parentOf = (name) => { const c = byName.get(name); return c && isChild(c) ? c.apiName.split('.')[0] : name; };
  let pool = components.filter((c) => !isChild(c));
  if (type === 'data-model') pool = pool.filter((c) => c.type === 'CustomObject' && !/__(e|mdt)$/.test(c.apiName));
  // Scope: entries of the story (or layer), plus their direct neighbours for context.
  if (opts.story || opts.layer) {
    const inScope = (c) => (opts.story ? hasStory(c, opts.story) || components.some((ch) => isChild(ch) && parentOf(ch.apiName) === c.apiName && hasStory(ch, opts.story)) : true) && (opts.layer ? c.layer === opts.layer : true);
    const core = new Set(pool.filter(inScope).map((c) => c.apiName));
    const ctx = new Set(core);
    for (const c of pool) {
      const deps = (c.dependsOn || []).map(parentOf);
      if (core.has(c.apiName)) deps.forEach((d) => ctx.add(d));
      if (deps.some((d) => core.has(d))) ctx.add(c.apiName);
    }
    pool = pool.filter((c) => ctx.has(c.apiName));
  }
  const names = new Set(pool.map((c) => c.apiName));
  const prefix = { new: '+ ', changed: '~ ', removed: '- ', unchanged: '' };
  const cards = pool.map((c) => {
    const kids = components.filter((ch) => isChild(ch) && parentOf(ch.apiName) === c.apiName && ch.status !== 'unchanged');
    const attrs = kids.map((ch) => `${prefix[ch.status] || ''}${ch.apiName.split('.').slice(1).join('.')}`);
    const card = {
      id: c.apiName, title: c.apiName, metadataType: c.type,
      status: c.status, story: c.status === 'unchanged' ? '' : String(c.story || '').split(',')[0].trim(),
      group: c.layer, attributes: attrs.length ? attrs : undefined,
    };
    if (type === 'data-model') card.entity = /__c$/.test(c.apiName) ? 'cloud' : 'related';
    else card.subtitle = TYPE_TITLE[c.type] || c.type;
    if (c.type === 'ExternalSystem') card.external = true;
    return card;
  });
  const seen = new Set();
  const connectors = [];
  for (const c of pool) {
    for (const d of c.dependsOn || []) {
      const to = parentOf(d);
      if (to === c.apiName || !names.has(to)) continue;
      const key = `${c.apiName}>${to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      connectors.push({ from: c.apiName, to, kind: type === 'data-model' ? 'lookup' : 'dependency' });
    }
  }
  const usedLayers = LAYERS.filter(([id]) => cards.some((c) => c.group === id));
  const groups = type === 'data-model' ? undefined : usedLayers.map(([id, label, icon]) => ({ id, label, icon: icon || undefined }));
  if (type === 'data-model') cards.forEach((c) => { delete c.group; });
  const scope = opts.story || opts.layer || 'all components';
  return {
    type,
    title: opts.title || `${TYPE_LABEL[type]}: ${scope}`,
    description: opts.description || (type === 'data-model'
      ? `Objects and relationships in scope for ${scope}, with the fields this work adds, changes or removes.`
      : `Platform components that deliver ${scope}, grouped by layer, with what this work adds, changes or removes.`),
    scope, source: 'components.json', groups, cards, connectors,
  };
}

// ------------------------------------------------------------------ checking a .drawio file

function checkDrawio(xml) {
  const problems = [];
  const warnings = [];
  if (!/<mxfile[\s>]/.test(xml) || !/<mxGraphModel[\s>]/.test(xml)) {
    if (/<diagram[^>]*>\s*[A-Za-z0-9+/=]{40,}\s*<\/diagram>/.test(xml)) return { problems: ['the diagram is stored compressed; turn compression off (draw.io: File > Properties > Compressed) to check it'], warnings, stats: {} };
    return { problems: ['not an uncompressed draw.io file (no <mxfile>/<mxGraphModel>)'], warnings, stats: {} };
  }
  const cells = [];
  const re = /<mxCell\b([^>]*?)(\/>|>([\s\S]*?)<\/mxCell>)/g;
  let m;
  while ((m = re.exec(xml))) {
    const attrs = {};
    m[1].replace(/([A-Za-z_:][\w:.-]*)="([^"]*)"/g, (_, k, v) => { attrs[k] = v; return ''; });
    cells.push({ attrs, body: m[3] || '', selfClosing: m[2] === '/>' });
  }
  const wrapped = [];
  xml.replace(/<(object|UserObject)\b([^>]*)>/g, (_, t, a) => { const id = /\bid="([^"]*)"/.exec(a); if (id) wrapped.push(id[1]); return ''; });
  const ids = new Map();
  for (const c of cells) if (c.attrs.id) ids.set(c.attrs.id, (ids.get(c.attrs.id) || 0) + 1);
  for (const id of wrapped) ids.set(id, (ids.get(id) || 0) + 1);
  for (const [id, n] of ids) if (n > 1) problems.push(`duplicate cell id "${id}"`);
  if (!ids.has('0') || !ids.has('1')) problems.push('root cells id="0" and id="1" are missing');
  const all = new Set(ids.keys());
  let edges = 0;
  let vertices = 0;
  const shapes = new Set();
  for (const c of cells) {
    const a = c.attrs;
    const st = (a.style || '').replace(/&amp;/g, '&');
    if (a.edge === '1') {
      if (a.parent !== 'key') edges++;
      if (c.selfClosing || !/<mxGeometry\b[^>]*relative="1"/.test(c.body)) problems.push(`edge "${a.id}" has no <mxGeometry relative="1" as="geometry"> child; it will not render`);
      for (const end of ['source', 'target']) if (a[end] && !all.has(a[end])) problems.push(`edge "${a.id}" ${end} "${a[end]}" does not exist`);
      if (!a.source && !a.target && !/sourcePoint/.test(c.body)) warnings.push(`edge "${a.id}" is not attached to any shape`);
    }
    if (a.vertex === '1') {
      vertices++;
      if (!/<mxGeometry\b/.test(c.body)) problems.push(`shape "${a.id}" has no geometry`);
    }
    if (a.parent && !all.has(a.parent)) problems.push(`cell "${a.id}" has parent "${a.parent}" which does not exist`);
    const sm = /(?:^|;)shape=mxgraph\.salesforce\.([^;]+)/.exec(st);
    if (sm) { shapes.add(sm[1]); if (!SF_ICONS[sm[1]]) problems.push(`shape "${a.id}" uses unknown Salesforce icon "${sm[1]}"; draw.io draws it as an empty box`); }
  }
  // Salesforce standard: a header on every diagram, and a key whenever colour, line style or icons carry meaning.
  const roleOf = (c) => (/sfRole=(\w+)/.exec(c.attrs.style || '') || [])[1];
  if (!cells.some((c) => roleOf(c) === 'header')) warnings.push('no header (sfRole=header): every Salesforce diagram has a title and a description');
  const statuses = new Set(cells.map((c) => (/sfStatus=(\w+)/.exec(c.attrs.style || '') || [])[1]).filter(Boolean));
  const meaningful = [...statuses].some((s) => s !== 'unchanged') || cells.some((c) => roleOf(c) === 'connector' && c.attrs.parent !== 'key');
  if (meaningful && !cells.some((c) => roleOf(c) === 'key')) warnings.push('no key (sfRole=key) although colour or line style carries meaning');
  const cardCount = cells.filter((c) => roleOf(c) === 'card').length;
  if (cardCount > MAX_CARDS) warnings.push(`${cardCount} cards: more than ${MAX_CARDS}; split the diagram`);
  return { problems, warnings, stats: { vertices, edges, cards: cardCount, salesforceIcons: [...shapes].sort() } };
}

// ------------------------------------------------------------------ draw.io desktop (optional, for images)

// Finds the draw.io desktop CLI: { cmd, wsl } or null. Under WSL the Windows app is used and paths
// are converted with wslpath. SF_SDLC_DRAWIO overrides the search.
function findDrawio(env = process.env, exists = fs.existsSync) {
  if (env.SF_SDLC_DRAWIO && exists(env.SF_SDLC_DRAWIO)) return { cmd: env.SF_SDLC_DRAWIO, wsl: /^\/mnt\/[a-z]\//.test(env.SF_SDLC_DRAWIO) };
  for (const name of ['drawio', 'draw.io']) if (lib.has(name)) return { cmd: name, wsl: false };
  const candidates = [];
  if (process.platform === 'darwin') candidates.push('/Applications/draw.io.app/Contents/MacOS/draw.io');
  if (process.platform === 'win32') {
    if (env.ProgramFiles) candidates.push(path.join(env.ProgramFiles, 'draw.io', 'draw.io.exe'));
    if (env.LOCALAPPDATA) candidates.push(path.join(env.LOCALAPPDATA, 'Programs', 'draw.io', 'draw.io.exe'));
  }
  if (process.platform === 'linux') {
    candidates.push('/opt/drawio/drawio', '/snap/bin/drawio');
    if (exists('/mnt/c/Program Files/draw.io/draw.io.exe')) return { cmd: '/mnt/c/Program Files/draw.io/draw.io.exe', wsl: true };
    try {
      for (const u of fs.readdirSync('/mnt/c/Users')) {
        const p = `/mnt/c/Users/${u}/AppData/Local/Programs/draw.io/draw.io.exe`;
        if (exists(p)) return { cmd: p, wsl: true };
      }
    } catch { /* not WSL */ }
  }
  for (const c of candidates) if (exists(c)) return { cmd: c, wsl: false };
  return null;
}

function exportDrawio(file, opts = {}) {
  const tool = findDrawio();
  if (!tool) return { ok: false, reason: 'draw.io desktop is not installed. Install it free from https://www.drawio.com, or open the .drawio file in draw.io (web or the VS Code "Draw.io Integration" extension) and export from there.' };
  const format = opts.format || 'png';
  if (!['png', 'svg', 'pdf'].includes(format)) return { ok: false, reason: 'format must be png, svg or pdf' };
  const output = opts.output || file.replace(/\.drawio(\.xml)?$/, '') + `.${format}`;
  const conv = (p) => {
    if (!tool.wsl) return p;
    const res = lib.run('wslpath', ['-w', path.resolve(p)], { timeout: 10000 });
    return res.status === 0 ? res.stdout.trim() : p;
  };
  const args = ['-x', '-f', format, '-o', conv(output)];
  if (format === 'png') args.push('-s', String(opts.scale || 2), '-b', '16');
  if (format === 'svg') args.push('--embed-svg-images');
  if (format !== 'png' && opts.embed !== false) args.push('-e');
  args.push(conv(file));
  let cmd = tool.cmd;
  let full = args;
  if (process.platform === 'linux' && !tool.wsl) {
    full = [...args, '--no-sandbox'];
    if (!process.env.DISPLAY && lib.has('xvfb-run')) { full = ['-a', cmd, ...full]; cmd = 'xvfb-run'; }
  }
  if (fs.existsSync(output)) fs.unlinkSync(output);
  const res = lib.run(cmd, full, { timeout: opts.timeout || 180000 });
  // draw.io desktop on Windows can crash while closing after it has written the file: the fresh
  // file is the result that counts (it was deleted above, so it cannot be a stale one).
  if (fs.existsSync(output) && fs.statSync(output).size > 0) return { ok: true, output, tool: tool.cmd };
  if (res.status !== 0 || !fs.existsSync(output)) return { ok: false, reason: `draw.io export failed: ${(res.stderr || res.stdout || String(res.error || '')).split('\n').slice(-6).join('\n')}` };
  return { ok: true, output, tool: tool.cmd };
}

module.exports = {
  TYPES, KINDS, STATUS, CLOUDS, ENTITIES, SF_ICONS, TYPE_ICON, normaliseType, validateSpec, layout, toDrawio,
  specFromComponents, checkDrawio, findDrawio, exportDrawio, iconStyle,
};
