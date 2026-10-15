// ── Match budget lines to categories ──────────────────────────────────
// Lists every line of the owner's budget sheet with a category picker. The choice is
// saved in their Apps Script, so it follows them to every device.
const CATS = ['Makan & Minum', 'Minyak Motor / Kereta', 'Keperluan/Komitmen', 'Telefon & Internet', 'Gajet/Subscription'];
const NONE = '';
const GUESS = [
  [/makan|minum|food|eat|meal|restoran|restaurant|kopi|coffee|cafe/i, 'Makan & Minum'],
  [/petrol|minyak|fuel|gas\b|diesel|parking|toll/i, 'Minyak Motor / Kereta'],
  [/post-?paid|pre-?paid|phone|telefon|internet|unifi|maxis|celcom|digi|u ?mobile|yes\b|wifi|broadband|time\b/i, 'Telefon & Internet'],
  [/spotify|netflix|youtube|icloud|itunes|apple|google one|gemini|storage|adobe|claude|chatgpt|openai|ps ?plus|playstation|xbox|disney|subscription|langganan|gadget|gajet/i, 'Gajet/Subscription'],
  [/simpanan|saving|tabung|investment|pelaburan|emergency|^commitments?$|^leisure$|total/i, NONE],
];
const guess = (line) => { for (const [re, cat] of GUESS) if (re.test(line)) return cat; return 'Keperluan/Komitmen'; };
const RM = (n) => 'RM' + (n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let sheet = null;
let lastFocus = null;

function close() {
  if (!sheet) return;
  sheet.remove();
  sheet = null;
  document.documentElement.classList.remove('xp-noscroll');
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function open() {
  const plan = window.dash.data('budget_plan');
  const saved = window.dash.data('budget_map');
  if (plan.status !== 'ok') return;
  const lines = plan.data.filter((b) => b.line !== 'Net Income');
  if (!lines.length) return;
  close();
  lastFocus = document.activeElement;
  const known = new Map((saved.status === 'ok' ? saved.data : []).map((r) => [r.line, r.category]));
  const first = known.size === 0;

  const wrap = document.createElement('div');
  wrap.className = 'xp-sheet';
  wrap.innerHTML = `
    <div class="xp-sheet-back" data-close></div>
    <div class="xp-sheet-card" role="dialog" aria-modal="true" aria-labelledby="map-title">
      <div class="xp-sheet-head">
        <div>
          <h2 id="map-title">Match your budget lines</h2>
          <p class="xp-note">Pick the category each line of your budget sheet belongs to. Lines left as “Not counted” stay out of the budgets.${first ? ' These are first guesses, so check each one.' : ''}</p>
        </div>
        <button type="button" class="xp-sheet-x" data-close aria-label="Close"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <ul class="xp-maplist"></ul>
      <div class="xp-sheet-foot">
        <p class="xp-maptotals" aria-live="polite"></p>
        <p class="xp-mapmsg" role="status" aria-live="polite"></p>
        <div class="xp-sheet-btns">
          <button type="button" class="xp-btn-ghost" data-close>Cancel</button>
          <button type="button" class="xp-btn" data-save>Save</button>
        </div>
      </div>
    </div>`;
  const list = wrap.querySelector('.xp-maplist');
  lines.forEach((b, i) => {
    const amount = (b.expenses || 0) + (b.liabilities || 0);
    const li = document.createElement('li');
    const id = 'map-' + i;
    li.innerHTML = '<label for="' + id + '"><span class="xp-mapline"></span><span class="xp-mapamt"></span></label><select id="' + id + '"></select>';
    li.querySelector('.xp-mapline').textContent = b.line;
    li.querySelector('.xp-mapamt').textContent = RM(amount);
    const sel = li.querySelector('select');
    [...CATS, NONE].forEach((c) => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c || 'Not counted';
      sel.append(o);
    });
    sel.value = known.has(b.line) ? (CATS.includes(known.get(b.line)) ? known.get(b.line) : NONE) : guess(b.line);
    sel.dataset.line = b.line;
    sel.dataset.amount = String(amount);
    list.append(li);
  });

  const totals = wrap.querySelector('.xp-maptotals');
  const showTotals = () => {
    const sum = Object.fromEntries(CATS.map((c) => [c, 0]));
    list.querySelectorAll('select').forEach((s) => { if (s.value) sum[s.value] += Math.round(+s.dataset.amount * 100); });
    totals.textContent = CATS.filter((c) => sum[c]).map((c) => c + ' ' + RM(sum[c] / 100)).join(' · ') || 'Nothing counted yet';
  };
  list.addEventListener('change', showTotals);
  showTotals();

  const msg = wrap.querySelector('.xp-mapmsg');
  const save = wrap.querySelector('[data-save]');
  save.addEventListener('click', async () => {
    const map = [...list.querySelectorAll('select')].map((s) => ({ line: s.dataset.line, category: s.value || 'none' }));
    const token = window.xpLock && window.xpLock.token();
    if (!token) { msg.textContent = 'The dashboard locked. Unlock it and try again.'; return; }
    save.disabled = true;
    msg.textContent = 'Saving…';
    let res = null;
    try { res = await window.xpApi.call('saveMap', { token, map }); } catch (e) { res = null; }
    save.disabled = false;
    if (res && res.ok) {
      window.dash.__set({ budget_map: { status: 'ok', data: res.budget_map, meta: [] } });
      close();
      return;
    }
    if (res && res.error === 'expired') { close(); window.xpLock.lockNow(); return; }
    msg.textContent = 'Couldn’t save just now. Please try again.';
  });
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  (document.querySelector('.xp') || document.body).append(wrap);
  document.documentElement.classList.add('xp-noscroll');
  sheet = wrap;
  setTimeout(() => list.querySelector('select') && list.querySelector('select').focus({ preventScroll: true }), 30);
}

window.xpMap = { open, close };
document.addEventListener('click', (e) => { if (e.target.closest('#map-open')) open(); });
