/**
 * XLRI Homecoming 2026 trivia challenge: Google Apps Script backend.
 *
 * Bound to the Google Sheet "Luminaire Challenge". It
 *   - reads the ANSWER KEY from Script properties (never in the website or on GitHub),
 *   - picks each player's random variants,
 *   - marks every answer and times the whole attempt on Google's clock,
 *   - allows ONE attempt per roll number,
 *   - writes everything to the Attempts tab; the Leaderboard tab ranks automatically.
 *
 * Run setup() once. Deploy as Web app: Execute as Me, Who has access: Anyone.
 * To close the challenge: Project Settings > Script properties > CLOSED = 1.
 */

// ---------- ANSWER KEY ----------
// The key is NOT in this file (this file is public on GitHub). Paste the one-line contents of
// answer-key.json into Project Settings > Script properties > ANSWER_KEY. Changing it takes
// effect immediately, no redeploy needed.
function answerKey_() {
  try {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty('ANSWER_KEY') || '{}');
  } catch (err) {
    return {};
  }
}

// Round order is fixed; each round has three variants. One is picked at random per player.
var SLOT_VARIANTS = [
  ['p1', 'p2', 'p3'],
  ['w1', 'w2', 'w3'],
  ['t1', 't2', 't3'],
  ['tl1', 'tl2', 'tl3'],
  ['e1', 'e2', 'e3']
];
var FEEDBACK_SLOTS = { 0: true, 1: true }; // only rounds 1 and 2 tell the player right/wrong

var ROLL_RE = /^[BH](25|26)[0-9]{3}$/;
var ATTEMPTS = 'Attempts';
var BOARD = 'Leaderboard';
var HEADERS = [
  'Roll number', 'Name', 'Started', 'Finished', 'Status', 'Score (of 5)', 'Total time (s)',
  'R1 time (s)', 'R2 time (s)', 'R3 time (s)', 'R4 time (s)', 'R5 time (s)', 'Variants',
  'R1 answer', 'R2 answer', 'R3 answer', 'R4 answer', 'R5 answer',
  'R1 correct', 'R2 correct', 'R3 correct', 'R4 correct', 'R5 correct', 'Token'
];
var C = { ROLL: 1, NAME: 2, STARTED: 3, FINISHED: 4, STATUS: 5, SCORE: 6, TIME: 7, RT: 8, PLAN: 13, ANS: 14, OK: 19, TOKEN: 24 };
var NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ATTEMPTS) || ss.insertSheet(ATTEMPTS);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  var lb = ss.getSheetByName(BOARD) || ss.insertSheet(BOARD);
  lb.getRange("A2:F").clearContent(); // keeps the formatting
  lb.getRange(1, 1, 1, 6).setValues([['Rank', 'Roll number', 'Name', 'Score (of 5)', 'Total time (s)', 'Finished at']]).setFontWeight('bold');
  lb.getRange('A2').setFormula('=ARRAYFORMULA(IF(B2:B="","",ROW(B2:B)-1))');
  // finished attempts only: highest score first, then fastest total time
  lb.getRange('B2').setFormula(
    '=IFERROR(QUERY(' + ATTEMPTS + "!A2:G,\"select A, B, F, G, D where E = 'finished' order by F desc, G asc\",0),\"\")"
  );
  lb.setFrozenRows(1);
}

// ---------- web app ----------
function doGet() {
  return json_({ ok: true, service: 'luminaire-trivia', open: !closed_(), keyLoaded: !!answerKey_().p1 });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    if (raw.length > 2000) return json_({ ok: false, error: 'invalid' });
    var req = JSON.parse(raw);
    if (req.action === 'start') return json_(start_(req.roll, req.name));
    if (req.action === 'answer') return json_(answer_(req.token, req.slot, req.value));
    if (req.action === 'finish') return json_(finish_(req.token));
    return json_({ ok: false, error: 'invalid' });
  } catch (err) {
    return json_({ ok: false, error: 'invalid' });
  } finally {
    lock.releaseLock();
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function closed_() {
  return PropertiesService.getScriptProperties().getProperty('CLOSED') === '1';
}
function sheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ATTEMPTS);
}
function findRow_(sh, col, value) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === value) return i + 2;
  return -1;
}
function norm_(s) {
  return String(s).replace(/^\s+|\s+$/g, '').toLowerCase();
}
function rev_(s) {
  return String(s).split('').reverse().join('');
}

function start_(rollIn, nameIn) {
  var roll = String(rollIn || '').replace(/\s+/g, '').toUpperCase();
  var name = String(nameIn || '').replace(/\s+/g, ' ').replace(/^ | $/g, '');
  if (!ROLL_RE.test(roll)) return { ok: false, error: 'invalid' };
  if (!NAME_RE.test(name)) return { ok: false, error: 'name' };
  if (closed_() || !answerKey_().p1) return { ok: false, error: 'closed' };
  var sh = sheet_();
  if (findRow_(sh, C.ROLL, roll) !== -1) return { ok: false, error: 'already' };
  var plan = SLOT_VARIANTS.map(function (v) { return v[Math.floor(Math.random() * v.length)]; });
  var token = Utilities.getUuid();
  var row = [roll, name, new Date(), '', 'started', 0, '', '', '', '', '', '', plan.join('|'), '', '', '', '', '', '', '', '', '', '', token];
  sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  return { ok: true, token: token, plan: plan };
}

function readRow_(sh, r) {
  return sh.getRange(r, 1, 1, HEADERS.length).getValues()[0];
}

function safeAnswer_(v) {
  var s = String(v === undefined || v === null ? '' : v);
  // plain text only: blocks spreadsheet formulas and oversized junk
  if (s.length === 0 || s.length > 80 || /^[=+\-@]/.test(s) || !/^[A-Za-z0-9 .,'()&—’-]+$/.test(s)) return null;
  return s;
}

function answer_(token, slotIn, value) {
  var slot = Number(slotIn);
  if (!token || slot !== Math.floor(slot) || slot < 0 || slot > 4) return { ok: false, error: 'invalid' };
  var sh = sheet_();
  var r = findRow_(sh, C.TOKEN, String(token));
  if (r === -1) return { ok: false, error: 'session' };
  var row = readRow_(sh, r);
  if (row[C.STATUS - 1] === 'finished') return { ok: false, error: 'finished' };
  var answered = 0;
  while (answered < 5 && row[C.ANS - 1 + answered] !== '') answered++;
  // already answered: return the stored result (safe to retry on a flaky network)
  if (slot < answered) return reply_(slot, row[C.OK - 1 + slot] === 1);
  if (slot !== answered) return { ok: false, error: 'order' };

  var variant = String(row[C.PLAN - 1]).split('|')[slot];
  var clean = safeAnswer_(value);
  var key = answerKey_()[variant];
  var ok = false;
  if (clean !== null && key !== undefined) {
    ok = norm_(clean) === norm_(key) || (slot === 1 && norm_(clean) === norm_(rev_(key)));
  }
  // seconds spent on this round = now - start - earlier rounds
  var spent = 0;
  for (var j = 0; j < slot; j++) spent += Number(row[C.RT - 1 + j]) || 0;
  var roundSec = Math.max(0, Math.round((Date.now() - new Date(row[C.STARTED - 1]).getTime()) / 10) / 100 - spent);
  sh.getRange(r, C.RT + slot).setValue(Math.round(roundSec * 100) / 100);
  sh.getRange(r, C.ANS + slot).setValue(clean === null ? 'invalid' : clean);
  sh.getRange(r, C.OK + slot).setValue(ok ? 1 : 0);
  return reply_(slot, ok);
}
function reply_(slot, ok) {
  var out = { ok: true };
  if (FEEDBACK_SLOTS[slot]) out.correct = ok;
  return out;
}

function finish_(token) {
  if (!token) return { ok: false, error: 'invalid' };
  var sh = sheet_();
  var r = findRow_(sh, C.TOKEN, String(token));
  if (r === -1) return { ok: false, error: 'session' };
  var row = readRow_(sh, r);
  if (row[C.STATUS - 1] === 'finished') return { ok: true, score: Number(row[C.SCORE - 1]), timeSec: Number(row[C.TIME - 1]) };
  for (var i = 0; i < 5; i++) if (row[C.ANS - 1 + i] === '') return { ok: false, error: 'incomplete' };
  var now = new Date();
  var score = 0;
  for (var k = 0; k < 5; k++) score += row[C.OK - 1 + k] === 1 ? 1 : 0;
  var timeSec = Math.round((now.getTime() - new Date(row[C.STARTED - 1]).getTime()) / 10) / 100;
  sh.getRange(r, C.FINISHED, 1, 4).setValues([[now, 'finished', score, timeSec]]);
  return { ok: true, score: score, timeSec: timeSec };
}
