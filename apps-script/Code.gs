/**
 * Expense Dashboard — the private link between your Google Sheets and the dashboard page.
 *
 * Put this in its OWN Apps Script project: go to script.google.com → New project.
 * Don't paste it into the script your iPhone Shortcut already sends expenses to,
 * or the Shortcut will stop logging.
 * Fill in CONFIG below, then deploy it as a web app
 * (Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone).
 *
 * Your sheets stay private. The page can only get your data after your 6-digit PIN
 * is checked here; the PIN is stored only as a salted hash in this script's properties.
 *
 * Forgot your PIN? In this project, choose "resetPin" in the function list at the top and press Run.
 * Then open the dashboard and create a new one. Your sheets aren't touched.
 */

var CONFIG = {
  // Link to your Expense Tracker sheet (the one your Shortcut logs to).
  EXPENSE_SHEET: '',
  // Link to your budget sheet (the one with Items | Expenses | Liabilities and Net Income).
  // Leave blank if the budget is a tab inside the expense sheet.
  BUDGET_SHEET: '',
};

var PIN_DIGITS = 6;
var MAX_TRIES = 5;            // wrong PINs before a pause
var FIRST_PAUSE_MS = 30000;   // 30 s, doubling after each further round, up to an hour
var MAX_PAUSE_MS = 3600000;
var HASH_ROUNDS = 1500;
var TOKEN_SECONDS = 6 * 3600; // an unlocked session lasts at most 6 hours

// ── Web app entry points ──────────────────────────────────────────────
function doGet() {
  return json_({ ok: true, app: 'expense-dashboard', v: 1 });
}

function doPost(e) {
  var req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  try {
    switch (req.action) {
      case 'status': return json_(status_());
      case 'setPin': return json_(setPin_(req));
      case 'unlock': return json_(unlock_(req));
      case 'data': return json_(withToken_(req, data_));
      case 'saveMap': return json_(withToken_(req, saveMap_));
      case 'lock': dropToken_(req.token); return json_({ ok: true });
      default: return json_({ ok: false, error: 'bad_request' });
    }
  } catch (err) {
    return json_({ ok: false, error: 'server', message: String(err && err.message || err) });
  }
}

/** Run this from the editor to clear a forgotten PIN. */
function resetPin() {
  var p = PropertiesService.getScriptProperties();
  ['pin_hash', 'pin_salt', 'pin_fails', 'pin_rounds', 'pin_pause_until'].forEach(function (k) { p.deleteProperty(k); });
  Logger.log('PIN cleared. Open the dashboard to create a new one.');
}

/** Run this from the editor to check that both sheets can be read. */
function testSheets() {
  var out = readAll_();
  Logger.log('Expense log: ' + (out.expenses.status === 'ok' ? out.expenses.data.length + ' entries from tab "' + out.expenses.sheet + '"' : out.expenses.message));
  Logger.log('Budget sheet: ' + (out.budget_plan.status === 'ok' ? out.budget_plan.data.length + ' lines from tab "' + out.budget_plan.sheet + '"' : out.budget_plan.message));
}

// ── PIN ───────────────────────────────────────────────────────────────
function props_() { return PropertiesService.getScriptProperties(); }

function hash_(pin, salt) {
  var saltBytes = Utilities.newBlob(salt).getBytes();
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin, Utilities.Charset.UTF_8);
  for (var i = 0; i < HASH_ROUNDS; i++) {
    bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes.concat(saltBytes));
  }
  return Utilities.base64Encode(bytes);
}

function validPin_(pin) {
  return typeof pin === 'string' && new RegExp('^[0-9]{' + PIN_DIGITS + '}$').test(pin);
}

function pauseLeft_(p) {
  var until = +(p.getProperty('pin_pause_until') || 0);
  return Math.max(0, until - Date.now());
}

function status_() {
  var p = props_();
  return { ok: true, hasPin: !!p.getProperty('pin_hash'), digits: PIN_DIGITS, wait_ms: pauseLeft_(p) };
}

function setPin_(req) {
  if (!validPin_(req.pin)) return { ok: false, error: 'bad_pin' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = props_();
    // A PIN can be created freely only when none exists; changing one needs an unlocked session.
    if (p.getProperty('pin_hash') && !tokenOk_(req.token)) return { ok: false, error: 'expired' };
    var salt = Utilities.getUuid();
    p.setProperties({ pin_salt: salt, pin_hash: hash_(req.pin, salt), pin_fails: '0', pin_rounds: '0', pin_pause_until: '0' });
    if (req.token) dropToken_(req.token);
    return { ok: true, token: newToken_() };
  } finally {
    lock.releaseLock();
  }
}

function unlock_(req) {
  if (!validPin_(req.pin)) return { ok: false, error: 'bad_pin' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = props_();
    var salt = p.getProperty('pin_salt');
    var stored = p.getProperty('pin_hash');
    if (!stored) return { ok: false, error: 'no_pin' };
    var wait = pauseLeft_(p);
    if (wait > 0) return { ok: false, error: 'paused', wait_ms: wait };
    if (hash_(req.pin, salt) === stored) {
      p.setProperties({ pin_fails: '0', pin_rounds: '0', pin_pause_until: '0' });
      return { ok: true, token: newToken_() };
    }
    var fails = +(p.getProperty('pin_fails') || 0) + 1;
    if (fails >= MAX_TRIES) {
      var rounds = +(p.getProperty('pin_rounds') || 0);
      var pause = Math.min(MAX_PAUSE_MS, FIRST_PAUSE_MS * Math.pow(2, rounds));
      p.setProperties({ pin_fails: '0', pin_rounds: String(rounds + 1), pin_pause_until: String(Date.now() + pause) });
      return { ok: false, error: 'paused', wait_ms: pause };
    }
    p.setProperty('pin_fails', String(fails));
    return { ok: false, error: 'wrong', left: MAX_TRIES - fails };
  } finally {
    lock.releaseLock();
  }
}

function newToken_() {
  var t = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('t_' + t, '1', TOKEN_SECONDS);
  return t;
}
function tokenOk_(t) {
  return typeof t === 'string' && t.length > 30 && CacheService.getScriptCache().get('t_' + t) === '1';
}
function dropToken_(t) {
  if (typeof t === 'string' && t) CacheService.getScriptCache().remove('t_' + t);
}
function withToken_(req, fn) {
  if (!tokenOk_(req.token)) return { ok: false, error: 'expired' };
  return fn(req);
}

// ── Data ──────────────────────────────────────────────────────────────
function data_() {
  var out = readAll_();
  delete out.expenses.sheet;
  delete out.budget_plan.sheet;
  return {
    ok: true,
    expenses: out.expenses,
    budget_plan: out.budget_plan,
    budget_map: JSON.parse(props_().getProperty('budget_map') || '[]'),
  };
}

function saveMap_(req) {
  var map = Array.isArray(req.map) ? req.map : null;
  if (!map) return { ok: false, error: 'bad_request' };
  var clean = map.filter(function (r) { return r && typeof r.line === 'string' && typeof r.category === 'string'; })
    .slice(0, 300)
    .map(function (r) { return { line: r.line.slice(0, 200), category: r.category.slice(0, 80) }; });
  props_().setProperty('budget_map', JSON.stringify(clean));
  return { ok: true, budget_map: clean };
}

function idOf_(link) {
  var s = String(link || '').trim();
  var m = s.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return m ? m[1] : s;
}

function openExpenseBook_() {
  if (CONFIG.EXPENSE_SHEET) return SpreadsheetApp.openById(idOf_(CONFIG.EXPENSE_SHEET));
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Set EXPENSE_SHEET in CONFIG (this script is not attached to a sheet).');
  return ss;
}

function readAll_() {
  var expenses, budget;
  var book = null;
  try {
    book = openExpenseBook_();
    expenses = readExpenses_(book);
  } catch (err) {
    expenses = { status: 'error', message: String(err && err.message || err), data: [], meta: [] };
  }
  try {
    var bbook = CONFIG.BUDGET_SHEET ? SpreadsheetApp.openById(idOf_(CONFIG.BUDGET_SHEET)) : book;
    if (!bbook) throw new Error('Budget sheet not set');
    budget = readBudget_(bbook);
  } catch (err) {
    budget = { status: 'error', message: String(err && err.message || err), data: [], meta: [] };
  }
  return { expenses: expenses, budget_plan: budget };
}

function num_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  var s = v.replace(/RM|,|\s/gi, '');
  var n = parseFloat(s.replace(/[()]/g, ''));
  return isFinite(n) ? (/^\(.*\)$/.test(s) ? -Math.abs(n) : n) : null;
}
function blank_(v) { return v === '' || v === null || v === undefined; }
function pad_(n) { return (n < 10 ? '0' : '') + n; }

function when_(v, tz) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz, "yyyy-MM-dd'T'HH:mm:ss");
  if (typeof v === 'number' && isFinite(v)) {
    var d = new Date(Math.round((v - 25569) * 86400) * 1000);
    return d.getUTCFullYear() + '-' + pad_(d.getUTCMonth() + 1) + '-' + pad_(d.getUTCDate()) + 'T' + pad_(d.getUTCHours()) + ':' + pad_(d.getUTCMinutes()) + ':' + pad_(d.getUTCSeconds());
  }
  var s = String(v == null ? '' : v).trim();
  var m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return m[3] + '-' + pad_(+m[2]) + '-' + pad_(+m[1]) + 'T' + pad_(+(m[4] || 0)) + ':' + pad_(+(m[5] || 0)) + ':' + pad_(+(m[6] || 0));
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  return m ? m[1] + '-' + m[2] + '-' + m[3] + 'T' + (m[4] || '00') + ':' + (m[5] || '00') + ':' + (m[6] || '00') : null;
}

var HEAD = { date: /^date$/i, category: /^category$/i, item: /^item$/i, amount: /^amount/i, method: /^(notes?|payment|method)$/i };

function readExpenses_(book) {
  var tz = book.getSpreadsheetTimeZone();
  var best = null;
  book.getSheets().forEach(function (sh) {
    var vals = sh.getDataRange().getValues();
    for (var r = 0; r < vals.length; r++) {
      var col = {};
      vals[r].forEach(function (v, c) {
        if (typeof v !== 'string') return;
        Object.keys(HEAD).forEach(function (k) { if (col[k] === undefined && HEAD[k].test(v.trim())) col[k] = c; });
      });
      if (col.date === undefined || col.category === undefined || col.item === undefined || col.amount === undefined) continue;
      var data = [];
      for (var rr = r + 1; rr < vals.length; rr++) {
        var x = vals[rr];
        if (blank_(x[col.date]) && blank_(x[col.item]) && blank_(x[col.amount])) continue;
        data.push({
          sheet_row: rr + 1,
          date: when_(x[col.date], tz),
          category: String(x[col.category] == null ? '' : x[col.category]).trim(),
          item: String(x[col.item] == null ? '' : x[col.item]).trim(),
          amount: num_(x[col.amount]),
          method: col.method === undefined ? '' : String(x[col.method] == null ? '' : x[col.method]).trim(),
        });
      }
      // The sheet's own "Total" row above the log, so the page can check its sums against it.
      var total = null;
      for (var t = 0; t < r; t++) {
        var row = vals[t];
        var at = -1;
        for (var c = 0; c < row.length; c++) if (typeof row[c] === 'string' && /^total$/i.test(row[c].trim())) { at = c; break; }
        if (at < 0) continue;
        var nums = [];
        for (var c2 = at + 1; c2 < row.length; c2++) if (typeof row[c2] === 'number') nums.push(row[c2]);
        if (nums.length) total = { amount: nums[0], entries: nums.length > 1 ? nums[1] : null };
      }
      if (!best || data.length > best.data.length) best = { sheet: sh.getName(), data: data, total: total };
      break;
    }
  });
  if (!best) throw new Error('No tab in the expense sheet has a log headed Date, Category, Item and Amount');
  var meta = [{ label: 'Sheet read', value: best.sheet }, { label: 'Entries read', value: String(best.data.length) }];
  if (best.total) {
    meta.push({ label: 'Sheet total (its own Total row)', value: String(best.total.amount) });
    if (best.total.entries != null) meta.push({ label: 'Sheet entry count (its own Total row)', value: String(best.total.entries) });
  }
  return { status: 'ok', sheet: best.sheet, data: best.data, columns: ['sheet_row', 'date', 'category', 'item', 'amount', 'method'], meta: meta };
}

function readBudget_(book) {
  var sheets = book.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var vals = sheets[s].getDataRange().getValues();
    for (var r = 0; r < vals.length; r++) {
      var find = function (re) {
        for (var c = 0; c < vals[r].length; c++) if (typeof vals[r][c] === 'string' && re.test(vals[r][c].trim())) return c;
        return undefined;
      };
      var exp = find(/^expenses$/i);
      var liab = find(/^liabilities$/i);
      if (exp === undefined || liab === undefined) continue;
      var label = find(/items?$/i);
      if (label === undefined) label = Math.min(exp, liab) - 1;
      var data = [];
      for (var rr = r + 1; rr < vals.length; rr++) {
        var x = vals[rr];
        if (typeof x[label] !== 'string' || !x[label].trim()) continue;
        var e = num_(x[exp]);
        var l = num_(x[liab]);
        if (e == null && l == null) continue;
        data.push({ line: x[label].trim(), expenses: e, liabilities: l, income: null });
      }
      // The "Net Income" figure: the first number to the right of that label, anywhere on the tab.
      outer:
      for (var t = 0; t < vals.length; t++) {
        for (var c = 0; c < vals[t].length; c++) {
          if (typeof vals[t][c] === 'string' && /^net income/i.test(vals[t][c].trim())) {
            for (var c2 = c + 1; c2 < vals[t].length; c2++) {
              var n = num_(vals[t][c2]);
              if (n != null) { data.push({ line: 'Net Income', expenses: null, liabilities: null, income: n }); break outer; }
            }
          }
        }
      }
      return { status: 'ok', sheet: sheets[s].getName(), data: data, columns: ['line', 'expenses', 'liabilities', 'income'], meta: [{ label: 'Sheet read', value: sheets[s].getName() }, { label: 'Budget lines read', value: String(data.length) }] };
    }
  }
  throw new Error('No tab in the budget sheet has a table headed Expenses and Liabilities');
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
