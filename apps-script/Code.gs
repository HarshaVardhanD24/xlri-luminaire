/**
 * Luminaire analytics: Google Apps Script web app backed by a Google Sheet.
 *
 * Paste this whole file into the Sheet's Extensions → Apps Script editor (see DEPLOY.md),
 * run setup() once, then deploy as a Web app (Execute as: Me, Who has access: Anyone).
 *
 * What it stores: anonymous events only (page loads, quiz progress, quiz answers as letters A-D,
 * result, share actions), plus a random per-tab session code, device type and QR source.
 * It never stores names, emails, phone numbers, roll numbers or IP addresses.
 *
 * The dashboard passcode lives in Project Settings → Script Properties (ADMIN_PASSCODE),
 * never in this file or in the website's code.
 */

var EVENTS_SHEET = 'Events';
var RESPONSES_SHEET = 'Responses';
var SUMMARY_SHEET = 'Summary';

var EVENT_HEADERS = ['received_at', 'client_time', 'session_id', 'event', 'question', 'label', 'result', 'runner_up', 'answers', 'source', 'device', 'duration_ms'];
var RESPONSE_HEADERS = ['received_at', 'session_id', 'result_id', 'result', 'runner_up', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'seconds', 'source', 'device'];

var EVENT_TYPES = ['page_load', 'section_view', 'quiz_start', 'question_view', 'quiz_complete', 'reveal_skip', 'share_open', 'share', 'retake'];
var ALUMNI = {
  LEE: 'Leena Nair', VIN: 'Vineet Nayar', MUT: 'B. Muthuraman', PAN: 'K. Pandiarajan', BHA: 'Abhijit Bhaduri',
  SEN: 'Sandip Sen', VAR: 'Varun Alagh', CHA: 'Chaitanya Peddi', NIK: 'Nikita Khanna'
};
var MAX_BATCH = 40;

/* ------------------------------------------------------------------ */
/* One-time setup: creates the three tabs with headers and formulas.   */
/* ------------------------------------------------------------------ */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ev = ss.getSheetByName(EVENTS_SHEET) || ss.insertSheet(EVENTS_SHEET);
  var rs = ss.getSheetByName(RESPONSES_SHEET) || ss.insertSheet(RESPONSES_SHEET);
  var sm = ss.getSheetByName(SUMMARY_SHEET) || ss.insertSheet(SUMMARY_SHEET, 0);

  ev.getRange(1, 1, 1, EVENT_HEADERS.length).setValues([EVENT_HEADERS]).setFontWeight('bold');
  ev.setFrozenRows(1);
  rs.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]).setFontWeight('bold');
  rs.setFrozenRows(1);

  var rows = [
    ['Metric', 'Value', 'Note'],
    ['Page loads', '=COUNTIF(Events!D:D,"page_load")', 'Every load or refresh. Not unique people.'],
    ['Quiz starts', '=COUNTIF(Events!D:D,"quiz_start")', ''],
    ['Quiz completions', '=MAX(0,COUNTA(Responses!A:A)-1)', 'One row per finished quiz in Responses'],
    ['Shares', '=COUNTIF(Events!D:D,"share")', 'Share sheet, download or copy link'],
    ['Retakes', '=COUNTIF(Events!D:D,"retake")', ''],
    ['Last event received', '=IFERROR(MAX(Events!A:A),"")', ''],
    ['', '', ''],
    ['Legacy match', 'Count', '']
  ];
  Object.keys(ALUMNI).forEach(function (id) {
    rows.push([ALUMNI[id], '=COUNTIF(Responses!C:C,"' + id + '")', '']);
  });
  rows.push(['', '', '']);
  rows.push(['Question', 'A / B / C / D', '']);
  ['F', 'G', 'H', 'I', 'J', 'K'].forEach(function (col, i) {
    rows.push(['Q' + (i + 1),
      '=COUNTIF(Responses!' + col + ':' + col + ',"A")&" / "&COUNTIF(Responses!' + col + ':' + col + ',"B")&" / "&COUNTIF(Responses!' + col + ':' + col + ',"C")&" / "&COUNTIF(Responses!' + col + ':' + col + ',"D")',
      '']);
  });
  sm.clear();
  sm.getRange(1, 1, rows.length, 3).setValues(rows);
  sm.getRange('A1:C1').setFontWeight('bold');
  sm.getRange('A9:C9').setFontWeight('bold');
  sm.getRange(rows.length - 6, 1, 1, 3).setFontWeight('bold');
  sm.getRange('B7').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sm.autoResizeColumns(1, 3);
  return 'Setup complete';
}

/* ------------------------------------------------------------------ */
/* HTTP entry points                                                   */
/* ------------------------------------------------------------------ */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  if (action === 'pulse') return json_(pulse_());
  return json_({ ok: true, service: 'luminaire', time: new Date().toISOString() });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Bad JSON' });
  }
  var action = body.action || 'track';
  if (action === 'track') return json_(track_(body.events));
  if (action === 'pulse') return json_(pulse_());
  if (action === 'stats') {
    var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSCODE');
    if (!expected) return json_({ ok: false, error: 'Set ADMIN_PASSCODE in Script Properties first' });
    if (String(body.passcode || '') !== expected) {
      Utilities.sleep(800); // slows down guessing
      return json_({ ok: false, error: 'Wrong passcode' });
    }
    return json_({ ok: true, stats: computeStats_(readEvents_(), Date.now()) });
  }
  return json_({ ok: false, error: 'Unknown action' });
}

/* ------------------------------------------------------------------ */
/* Tracking                                                            */
/* ------------------------------------------------------------------ */
function clean_(v, re, max) {
  if (v === null || v === undefined || v === '') return '';
  var s = String(v).slice(0, max);
  return re.test(s) ? s : '';
}
function int_(v, lo, hi) {
  var n = Number(v);
  return isFinite(n) && n >= lo && n <= hi ? Math.round(n) : '';
}

/** Strict allow-lists also block spreadsheet formula injection (no value can start with = + - @). */
function sanitize_(ev) {
  if (!ev || EVENT_TYPES.indexOf(ev.event) < 0) return null;
  var sid = clean_(ev.session_id, /^[a-z][a-z0-9-]{7,39}$/i, 40);
  if (!sid) return null;
  var ct = new Date(ev.created_at);
  return {
    client_time: isNaN(ct.getTime()) ? '' : ct.toISOString(),
    session_id: sid,
    event: ev.event,
    question: int_(ev.question, 1, 6),
    label: clean_(ev.label, /^[a-z][a-z0-9_]{0,39}$/, 40),
    result: clean_(ev.result, /^[A-Z]{3}$/, 3),
    runner_up: clean_(ev.runner_up, /^[A-Z]{3}$/, 3),
    answers: clean_(ev.answers, /^[A-D]{6}$/, 6),
    source: clean_(ev.source, /^[a-z0-9][a-z0-9_-]{0,39}$/, 40),
    device: clean_(ev.device, /^(mobile|tablet|desktop)$/, 7),
    duration_ms: int_(ev.duration_ms, 0, 3600000)
  };
}

function track_(events) {
  if (!Array.isArray(events) || !events.length) return { ok: false, error: 'No events' };
  var now = new Date();
  var clean = events.slice(0, MAX_BATCH).map(sanitize_).filter(function (x) { return x; });
  if (!clean.length) return { ok: false, error: 'No valid events' };

  var evRows = clean.map(function (c) {
    return [now, c.client_time, c.session_id, c.event, c.question, c.label, c.result, c.runner_up, c.answers, c.source, c.device, c.duration_ms];
  });
  var respRows = clean.filter(function (c) { return c.event === 'quiz_complete' && c.answers && ALUMNI[c.result]; }).map(function (c) {
    var a = c.answers.split('');
    return [now, c.session_id, c.result, ALUMNI[c.result], ALUMNI[c.runner_up] || '', a[0], a[1], a[2], a[3], a[4], a[5],
      c.duration_ms === '' ? '' : Math.round(c.duration_ms / 1000), c.source, c.device];
  });

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ev = ss.getSheetByName(EVENTS_SHEET);
    if (!ev) { setup(); ev = ss.getSheetByName(EVENTS_SHEET); }
    ev.getRange(ev.getLastRow() + 1, 1, evRows.length, EVENT_HEADERS.length).setValues(evRows);
    if (respRows.length) {
      var rs = ss.getSheetByName(RESPONSES_SHEET);
      rs.getRange(rs.getLastRow() + 1, 1, respRows.length, RESPONSE_HEADERS.length).setValues(respRows);
    }
  } finally {
    lock.releaseLock();
  }
  if (respRows.length) CacheService.getScriptCache().remove('pulse');
  return { ok: true, stored: evRows.length };
}

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */
function readEvents_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EVENTS_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, EVENT_HEADERS.length).getValues();
  return values.map(function (r) {
    return {
      created_at: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      session_id: String(r[2]),
      event: String(r[3]),
      question: r[4] === '' ? null : Number(r[4]),
      label: r[5] || null,
      result: r[6] || null,
      runner_up: r[7] || null,
      answers: r[8] || null,
      source: r[9] || null,
      device: r[10] || null,
      duration_ms: r[11] === '' ? null : Number(r[11])
    };
  });
}

/** Public, anonymous totals for the landing page ("N journeys discovered"). Cached 60 s. */
function pulse_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('pulse');
  if (hit) return JSON.parse(hit);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONSES_SHEET);
  var results = {};
  var n = 0;
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 3, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
      if (!r[0]) return;
      n++;
      results[r[0]] = (results[r[0]] || 0) + 1;
    });
  }
  var out = { completions: n, results: results };
  cache.put('pulse', JSON.stringify(out), 60);
  return out;
}

/* Mirror of src/utils/stats.ts computeStats(). Keep both in sync. */
function computeStats_(events, now) {
  function of(name) { return events.filter(function (r) { return r.event === name; }); }
  function distinct(rows) { var s = {}; rows.forEach(function (r) { s[r.session_id] = 1; }); return Object.keys(s).length; }
  function countBy(rows, key, unique) {
    var m = {};
    rows.forEach(function (r) {
      var k = key(r);
      if (k === null || k === undefined || k === '') return;
      if (unique) { m[k] = m[k] || {}; m[k][r.session_id] = 1; } else { m[k] = (m[k] || 0) + 1; }
    });
    var out = {};
    Object.keys(m).forEach(function (k) { out[k] = unique ? Object.keys(m[k]).length : m[k]; });
    return out;
  }

  var completes = of('quiz_complete');
  var durations = completes.map(function (c) { return c.duration_ms; })
    .filter(function (d) { return d !== null && d !== undefined && !isNaN(d); })
    .sort(function (a, b) { return a - b; });
  var median = null;
  if (durations.length) {
    var mid = (durations.length - 1) / 2;
    median = Math.round(((durations[Math.floor(mid)] + durations[Math.ceil(mid)]) / 2 / 1000) * 10) / 10;
  }

  var answers = {};
  completes.forEach(function (c) {
    if (!c.answers) return;
    c.answers.split('').forEach(function (opt, i) {
      var q = answers[String(i + 1)] = answers[String(i + 1)] || {};
      q[opt] = (q[opt] || 0) + 1;
    });
  });

  var src = {};
  events.forEach(function (r) {
    var k = r.source || 'direct';
    src[k] = src[k] || { s: {}, c: {} };
    if (r.event === 'page_load') src[k].s[r.session_id] = 1;
    if (r.event === 'quiz_complete') src[k].c[r.session_id] = 1;
  });
  var sources = Object.keys(src).map(function (k) {
    return { source: k, sessions: Object.keys(src[k].s).length, completions: Object.keys(src[k].c).length };
  }).sort(function (a, b) { return b.sessions - a.sessions; });

  var hours = {};
  events.forEach(function (r) {
    var t = new Date(r.created_at).getTime();
    if (isNaN(t) || now - t > 24 * 3600e3) return;
    var h = new Date(t);
    h.setUTCMinutes(0, 0, 0);
    var k = h.toISOString();
    hours[k] = hours[k] || { s: {}, c: 0 };
    if (r.event === 'page_load') hours[k].s[r.session_id] = 1;
    if (r.event === 'quiz_complete') hours[k].c++;
  });
  var hourly = Object.keys(hours).sort().map(function (k) {
    return { hour: k, sessions: Object.keys(hours[k].s).length, completions: hours[k].c };
  });

  return {
    generated_at: new Date(now).toISOString(),
    page_loads: of('page_load').length,
    sessions: distinct(of('page_load')),
    starts: distinct(of('quiz_start')),
    completers: distinct(completes),
    completions: completes.length,
    shares: of('share').length,
    share_sessions: distinct(of('share')),
    retakes: of('retake').length,
    reveal_skips: of('reveal_skip').length,
    median_seconds: median,
    results: countBy(completes, function (r) { return r.result; }),
    answers: answers,
    dropoff: countBy(of('question_view'), function (r) { return r.question ? String(r.question) : null; }, true),
    sections: countBy(of('section_view'), function (r) { return r.label; }, true),
    shares_by: countBy(of('share'), function (r) { return r.label || 'unknown'; }),
    devices: countBy(of('page_load'), function (r) { return r.device; }, true),
    sources: sources,
    hourly: hourly
  };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* Optional: run this from the editor to check writing works before going live. */
function testTrack() {
  return track_([
    { event: 'page_load', session_id: 's-testtest01', created_at: new Date().toISOString(), device: 'desktop', source: 'editor-test' },
    { event: 'quiz_complete', session_id: 's-testtest01', result: 'LEE', runner_up: 'BHA', answers: 'AAAAAA', duration_ms: 60000, device: 'desktop', source: 'editor-test' }
  ]);
}
