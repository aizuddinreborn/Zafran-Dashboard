// ── PIN lock: create once, then enter on every open and after 5 minutes away ──
// The PIN is checked by the owner's Apps Script, which keeps only a salted hash of it and
// pauses after repeated wrong tries. No sheet data reaches this page until it is unlocked,
// and the rows are dropped from memory again when it locks.
const DIGITS = 6;
const RELOCK_AFTER_MS = 5 * 60 * 1000;
const REFRESH_AFTER_MS = 60 * 1000;
const api = window.xpApi;

const lockEl = document.getElementById('lock');
const els = {
  title: document.getElementById('lock-title'),
  sub: document.getElementById('lock-sub'),
  dots: document.getElementById('lock-dots'),
  msg: document.getElementById('lock-msg'),
  keypad: document.getElementById('keypad'),
  left: document.getElementById('lock-left'),
  del: document.getElementById('lock-del'),
  retry: document.getElementById('lock-retry'),
  help: document.getElementById('lock-help'),
  connect: document.getElementById('lock-connect'),
  url: document.getElementById('lock-url'),
  relink: document.getElementById('lock-relink'),
};

let mode = 'checking'; // checking | connect | error | create | confirm | enter | verify-old | open
let changing = false;  // true while changing an existing PIN
let entry = '';
let firstPin = '';
let token = null;
let busy = false;
let pauseUntil = 0;
let hiddenAt = null;
let pauseTimer = null;
let loadedAt = 0;
let loading = null;
let mapOffered = false;

const COPY = {
  checking: ['Checking your PIN', 'One moment'],
  connect: ['Connect your sheet', 'Paste the web app link from your Apps Script. It ends in /exec.'],
  error: ['Can’t reach your sheet', 'Check your connection and try again.'],
  create: ['Create a PIN', DIGITS + ' digits · you’ll enter it each time you open the dashboard'],
  confirm: ['Confirm your PIN', 'Enter the same ' + DIGITS + ' digits again'],
  enter: ['Enter your PIN', 'Your dashboard is locked'],
  'verify-old': ['Enter your current PIN', 'Then choose a new one'],
};

const paused = () => pauseUntil > Date.now() && (mode === 'enter' || mode === 'verify-old');

function paint() {
  const [title, sub] = COPY[mode] || ['', ''];
  els.title.textContent = changing && mode === 'create' ? 'Create a new PIN' : title;
  els.sub.textContent = sub;
  const dots = els.dots.children;
  for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i < entry.length);
  els.dots.classList.toggle('is-wait', mode === 'checking' || busy);
  const noPad = mode === 'error' || mode === 'connect';
  els.dots.hidden = noPad;
  const keysOff = mode === 'checking' || noPad || busy || paused();
  els.keypad.classList.toggle('is-off', !!keysOff);
  els.keypad.hidden = noPad;
  els.retry.hidden = mode !== 'error';
  els.relink.hidden = !(mode === 'error' && !api.isFixed());
  els.connect.hidden = mode !== 'connect';
  els.left.textContent = mode === 'enter' ? 'Forgot?' : mode === 'confirm' ? 'Start over' : changing ? 'Cancel' : '';
  els.left.disabled = !els.left.textContent || mode === 'checking';
  els.del.disabled = !entry.length || keysOff;
  if (mode !== 'enter') els.help.hidden = true;
}
function say(text, tone) {
  els.msg.textContent = text || '';
  els.msg.dataset.tone = tone || '';
}
function shake() {
  els.dots.classList.remove('is-bad');
  void els.dots.offsetWidth;
  els.dots.classList.add('is-bad');
  if (navigator.vibrate) navigator.vibrate(80);
}
function setMode(next, message, tone) {
  mode = next;
  entry = '';
  busy = false;
  say(message, tone);
  paint();
}
function showPause() {
  clearInterval(pauseTimer);
  const tick = () => {
    const left = pauseUntil - Date.now();
    if (left <= 0) { clearInterval(pauseTimer); say(''); paint(); return; }
    const s = Math.ceil(left / 1000);
    say('Too many tries. Try again in ' + (s > 90 ? Math.ceil(s / 60) + ' min' : s + 's'), 'bad');
    paint();
  };
  tick();
  pauseTimer = setInterval(tick, 500);
}

async function boot() {
  if (!api.url() && !window.__xpUrl) { setMode('connect'); return; }
  setMode('checking');
  try {
    const res = await api.call('status', {}, 30000);
    if (res && res.app !== 'expense-dashboard' && (res.loggedAs || res.received || res.status)) throw new Error('logger');
    if (!res || !res.ok) throw new Error(res && res.error === 'server' ? 'server:' + (res.message || '') : (res && res.error) || 'bad');
    if (res.hasPin) {
      setMode('enter');
      if (res.wait_ms > 0) { pauseUntil = Date.now() + res.wait_ms; showPause(); }
    } else {
      setMode('create');
    }
  } catch (e) {
    setMode('error', explain(String(e && e.message)), 'bad');
  }
}

// Turns a failed connection into the likely fix in Apps Script
function explain(code) {
  if (code === 'no_url') return '';
  if (code === 'logger') return 'This is the link your iPhone Shortcut logs expenses to, not the dashboard’s script (it may have added a blank Lain-lain row — delete it). Make a separate project at script.google.com for the dashboard and use its /exec link.';
  if (code === 'blocked') return 'Google refused the request. In Apps Script open Deploy → Manage deployments → edit (pencil): set Execute as “Me” and Who has access “Anyone” (not “Anyone with Google account”), choose Version “New version”, then Deploy.';
  if (code === 'not_json') return 'The link answered, but not with this dashboard’s script. Save the pasted Code.gs, then Deploy → Manage deployments → edit → Version “New version” → Deploy.';
  if (code === 'timeout') return 'Your Apps Script took too long to answer. Try again in a moment.';
  if (/^http_/.test(code)) return 'Google answered with error ' + code.slice(5) + '. Check the link is the Web app URL ending in /exec.';
  if (/^server:/.test(code)) return 'Your Apps Script hit an error: ' + code.slice(7);
  return 'Your Apps Script didn’t answer as expected (' + code + ').';
}

// ── Data ──
async function load(quiet) {
  if (!token) return;
  if (loading) return loading;
  loading = (async () => {
    let res;
    try { res = await api.call('data', { token }, 60000); } catch (e) { res = null; }
    if (res && res.error === 'expired') { lockNow(); return; }
    if (!res || !res.ok) {
      if (!quiet) window.dash.__set({ expenses: { status: 'error', data: [], meta: [] }, budget_plan: { status: 'error', data: [], meta: [] }, budget_map: { status: 'ok', data: [], meta: [] } });
      return;
    }
    if (!token) return; // locked while loading
    loadedAt = Date.now();
    const ds = (d) => (d && d.status === 'ok' ? { status: 'ok', data: d.data || [], meta: d.meta || [] } : { status: 'error', data: [], meta: [], message: d && d.message });
    window.dash.__set({ expenses: ds(res.expenses), budget_plan: ds(res.budget_plan), budget_map: { status: 'ok', data: res.budget_map || [], meta: [] } });
    const lines = res.budget_plan && res.budget_plan.status === 'ok' ? res.budget_plan.data.filter((b) => b.line !== 'Net Income') : [];
    if (!mapOffered && lines.length && !(res.budget_map || []).length && window.xpMap) {
      mapOffered = true;
      setTimeout(() => window.xpMap.open(), 700);
    }
  })();
  try { await loading; } finally { loading = null; }
}

function open() {
  mode = 'open';
  changing = false;
  entry = '';
  say('');
  lockEl.classList.add('is-leaving');
  setTimeout(() => {
    lockEl.hidden = true;
    lockEl.classList.remove('is-leaving');
    window.xpDash.show();
    if (!loadedAt) load(false);
  }, 260);
}
function lockNow() {
  if (mode !== 'open' && !token) return;
  if (token) api.call('lock', { token }, 15000).catch(() => {});
  token = null;
  loadedAt = 0;
  window.dash.__clear();
  window.xpDash.hide();
  if (window.xpMap) window.xpMap.close();
  lockEl.hidden = false;
  setMode('enter');
  if (pauseUntil > Date.now()) showPause();
  lockEl.scrollIntoView({ block: 'start' });
}
function changePin() {
  if (mode !== 'open') return;
  window.xpDash.hide();
  if (window.xpMap) window.xpMap.close();
  lockEl.hidden = false;
  changing = true;
  setMode('verify-old');
  lockEl.scrollIntoView({ block: 'start' });
}

function afterFail(res) {
  entry = '';
  shake();
  if (res && res.error === 'paused') { pauseUntil = Date.now() + (res.wait_ms || 30000); paint(); showPause(); return; }
  if (res && res.error === 'wrong') {
    const left = res.left;
    say(left <= 2 ? 'Wrong PIN · ' + left + (left === 1 ? ' try' : ' tries') + ' left before a pause' : 'Wrong PIN', 'bad');
  } else say('Couldn’t check your PIN. Please try again.', 'bad');
  paint();
}

async function submit() {
  const pin = entry;
  if (mode === 'create') {
    firstPin = pin;
    setMode('confirm');
    return;
  }
  if (mode === 'confirm') {
    if (pin !== firstPin) {
      firstPin = '';
      shake();
      setMode('create', 'Those didn’t match. Let’s try again.', 'bad');
      return;
    }
    busy = true;
    paint();
    let res = null;
    try { res = await api.call('setPin', { pin, token: changing ? token : undefined }); } catch (e) { res = null; }
    firstPin = '';
    if (res && res.ok) {
      token = res.token;
      say(changing ? 'New PIN saved' : 'PIN saved', 'good');
      els.dots.classList.add('is-good');
      setTimeout(() => { els.dots.classList.remove('is-good'); open(); }, 450);
      return;
    }
    if (res && res.error === 'expired') { changing = false; token = null; window.dash.__clear(); loadedAt = 0; setMode('enter', 'Your session ended. Enter your PIN.', 'bad'); return; }
    setMode('create', 'Couldn’t save your PIN. Please try again.', 'bad');
    return;
  }
  if (mode === 'enter' || mode === 'verify-old') {
    busy = true;
    paint();
    let res = null;
    try { res = await api.call('unlock', { pin }); } catch (e) { res = null; }
    busy = false;
    if (res && res.ok) {
      pauseUntil = 0;
      if (mode === 'verify-old') {
        if (token && token !== res.token) api.call('lock', { token }, 15000).catch(() => {});
        token = res.token;
        setMode('create');
        return;
      }
      token = res.token;
      els.dots.classList.add('is-good');
      say('');
      paint();
      setTimeout(() => { els.dots.classList.remove('is-good'); open(); }, 220);
      return;
    }
    if (res && res.error === 'no_pin') { setMode('create', 'No PIN is set yet. Create one.', ''); return; }
    afterFail(res);
  }
}

function press(d) {
  if (busy || mode === 'checking' || mode === 'error' || mode === 'connect' || mode === 'open' || els.keypad.classList.contains('is-off')) return;
  if (entry.length >= DIGITS) return;
  if (!entry.length && els.msg.dataset.tone === 'bad' && !paused()) say('');
  els.dots.classList.remove('is-bad');
  entry += d;
  paint();
  if (entry.length === DIGITS) setTimeout(submit, 120);
}
function backspace() {
  if (busy || !entry.length) return;
  entry = entry.slice(0, -1);
  paint();
}

els.keypad.addEventListener('click', (e) => {
  const key = e.target.closest('.xp-key[data-key]');
  if (key) press(key.dataset.key);
});
els.del.addEventListener('click', backspace);
els.left.addEventListener('click', () => {
  if (mode === 'enter') { els.help.hidden = !els.help.hidden; return; }
  if (mode === 'confirm') { firstPin = ''; setMode('create'); return; }
  if (changing) { changing = false; firstPin = ''; open(); }
});
els.retry.addEventListener('click', boot);
els.relink.addEventListener('click', () => { api.clearUrl(); setMode('connect'); });
els.connect.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = els.url.value.trim();
  if (!api.valid(u)) { say('That isn’t a web app link. It starts with https://script.google.com/macros/s/ and ends in /exec.', 'bad'); return; }
  api.setUrl(u);
  boot();
});
document.addEventListener('keydown', (e) => {
  if (lockEl.hidden || mode === 'connect' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key); }
  else if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (mode === 'open' && hiddenAt && Date.now() - hiddenAt >= RELOCK_AFTER_MS) lockNow();
  else if (mode === 'open' && token && Date.now() - loadedAt >= REFRESH_AFTER_MS) load(true);
  hiddenAt = null;
});
window.xpLock = { lockNow, changePin, token: () => token, reload: () => load(true) };
boot();
