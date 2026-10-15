const root = document.querySelector('.xp');
const $ = (id) => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const S = (id) => dash.data(id);

// ── Look-up tables ─────────────────────────────────────────────
const CATS = {
  'Makan & Minum': { c: 'var(--c1)', icon: 'food' },
  'Minyak Motor / Kereta': { c: 'var(--c2)', icon: 'fuel' },
  'Keperluan/Komitmen': { c: 'var(--c3)', icon: 'basket' },
  'Telefon & Internet': { c: 'var(--c4)', icon: 'wifi' },
  'Gajet/Subscription': { c: 'var(--c5)', icon: 'device' },
  'Simpanan': { c: 'var(--c6)', icon: 'coins' },
  'Lain-lain': { c: 'var(--c7)', icon: 'dots' },
};
const CAT_ORDER = ['Makan & Minum', 'Minyak Motor / Kereta', 'Keperluan/Komitmen', 'Telefon & Internet', 'Gajet/Subscription', 'Lain-lain', 'Simpanan'];
const catName = (c) => ({ 'Gajet': 'Gajet/Subscription', 'Keperluan': 'Keperluan/Komitmen' })[c] || c;
const catInfo = (name) => CATS[name] || { c: 'var(--c8)', icon: 'tag' };
const STATUS = {
  'On track': { c: 'var(--good)', icon: 'check' },
  'Within plan': { c: 'var(--good)', icon: 'check' },
  'Within budget': { c: 'var(--good)', icon: 'check' },
  'Saved': { c: 'var(--good)', icon: 'coins' },
  'Ahead of pace': { c: 'var(--warn)', icon: 'alert' },
  'Nearly used': { c: 'var(--warn)', icon: 'alert' },
  'Used up': { c: 'var(--warn)', icon: 'alert' },
  'Over plan': { c: 'var(--critical)', icon: 'over' },
  'Over budget': { c: 'var(--critical)', icon: 'over' },
  'No budget': { c: 'var(--ink-3)', icon: 'tag' },
  'No plan': { c: 'var(--ink-3)', icon: 'tag' },
};
const ICONS = {
  food: 'M7 3v7M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3M7 10v11M17 21V3c-2 0-3.5 2.5-3.5 6s1.5 5 3.5 5',
  fuel: 'M5 21V5.5A2.5 2.5 0 0 1 7.5 3h5A2.5 2.5 0 0 1 15 5.5V21M3.5 21h13M7.5 9h5M15 9.5h1.5a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8.5L19 6',
  basket: 'M3.5 9.5h17l-1.6 9.1a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6L3.5 9.5zM8 9.5l3-5.5M16 9.5l-3-5.5M9.5 13v3.5M14.5 13v3.5',
  wifi: 'M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 15.8a5 5 0 0 1 6.4 0M12 19.2h.01',
  device: 'M8 2.5h8A1.5 1.5 0 0 1 17.5 4v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM10.5 18.5h3',
  coins: 'M12 4c4.1 0 7.5 1.2 7.5 2.8S16.1 9.5 12 9.5 4.5 8.4 4.5 6.8 7.9 4 12 4zM4.5 6.8v5c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-5M4.5 11.8v5c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-5',
  dots: 'M5.5 12h.01M12 12h.01M18.5 12h.01',
  tag: 'M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9-8-8zM8 8h.01',
  card: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11zM3 10h18M7 15h3',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 20h2M20 14v2',
  cash: 'M2.5 7h19v10h-19zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 10v4M18 10v4',
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5v10A2.5 2.5 0 0 0 6.5 20H20v-4M4 7.5A2.5 2.5 0 0 0 6.5 10H20v6h-4a2 2 0 0 1 0-4h4',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l2.7 2.7L16.2 9.5',
  alert: 'M12 3.5l9.5 16.5h-19L12 3.5zM12 10v4.5M12 17.5h.01',
  over: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v6M12 16.5h.01',
  repeat: 'M17 2.5l3 3-3 3M4 11V9.5a4 4 0 0 1 4-4h12M7 21.5l-3-3 3-3M20 13v1.5a4 4 0 0 1-4 4H4',
  bolt: 'M13 2.5 4.5 13.5H12l-1 8 8.5-11H12l1-8z',
  calendar: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12zM4 10h16M8 3v4M16 3v4',
  spark: 'M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z',
};
const METHOD_ICON = { 'Credit Card': 'card', 'Debit Card': 'card', 'QR Pay': 'qr', 'Cash': 'cash' };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Small helpers ──────────────────────────────────────────────
const enc = (v) => String(v).replace(/%/g, '%25').replace(/&/g, '%26').replace(/=/g, '%3D');
const markEl = (el, source, field, where) => {
  el.setAttribute('data-source', source);
  if (field) el.setAttribute('data-field', field);
  if (typeof where === 'number') el.setAttribute('data-row', String(where));
  else if (where) el.setAttribute('data-where', Object.entries(where).map(([k, v]) => k + '=' + enc(v)).join('&'));
  return el;
};
const h = (tag, props, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style') for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk, sv);
    else if (k === 'mark') markEl(el, ...v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid);
  return el;
};
const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));
const icon = (name) => {
  const s = document.createElementNS(SVGNS, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': name === 'dots' ? 3 : 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) s.setAttribute(k, v);
  const p = document.createElementNS(SVGNS, 'path');
  p.setAttribute('d', ICONS[name] || ICONS.tag);
  s.append(p);
  return s;
};
const nf2 = new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const RM = (v) => (v == null || !Number.isFinite(v) ? '—' : (v < 0 ? '-' : '') + 'RM' + nf2.format(Math.abs(v)));
const RMsigned = (v) => (v == null ? '—' : (v > 0 ? '+' : '') + RM(v));
const RMaxis = (v) => (v >= 1000 ? 'RM' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : 'RM' + Math.round(v));
const pctTxt = (v) => (v == null ? '—' : String(v) + '%');
const ymd = (date) => date.slice(0, 10).split('-').map(Number);
const dayShort = (date) => { const [, m, d] = ymd(date); return d + ' ' + MON[m - 1]; };
const dayLong = (date) => { const [y, m, d] = ymd(date); return DOW[new Date(y, m - 1, d).getDay()] + ', ' + d + ' ' + MON[m - 1]; };
const plural = (n, one, many) => (n === 1 ? one : many);
const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
const statusChip = (status, mark) => h('span', { class: 'xp-chip', style: { '--st': (STATUS[status] || STATUS['No plan']).c } }, icon((STATUS[status] || STATUS['No plan']).icon), h('span', { mark, text: status }));
const textW = (svg, text, cls) => { const t = svg.append('text').attr('class', cls).text(text); const w = t.node().getComputedTextLength(); t.remove(); return w; };
const placeTip = (box, tip, px, py) => {
  const bw = box.clientWidth;
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let left = px + 14;
  if (left + tw > bw) left = px - tw - 14;
  tip.style.left = Math.max(0, left) + 'px';
  tip.style.top = Math.max(0, py - th - 10) + 'px';
};

// Status of the sources a card needs: draws the waiting / failed state and returns true when not ready.
const notReady = (box, ids, rows = 4) => {
  const bad = ids.map((id) => S(id)).find((d) => d.status !== 'ok');
  if (!bad) return false;
  if (bad.status === 'error' || bad.status === 'missing') box.replaceChildren(h('div', { class: 'xp-fail', text: 'Failed to load' }));
  else if (bad.status === 'connect') box.replaceChildren(h('div', { class: 'xp-wait', text: 'Waiting for your Google Drive connection' }));
  else if (bad.status === 'declined') box.replaceChildren(h('div', { class: 'xp-wait', text: 'Google Drive access was declined' }));
  else if (!box.querySelector('.dash-skeleton')) box.replaceChildren(h('div', { class: 'xp-skrows' }, Array.from({ length: rows }, () => h('span', { class: 'dash-skeleton', text: 'Loading' }))));
  return true;
};

// ── Page state ─────────────────────────────────────────────────
let firstDraw = true;
let search = '';
const pickMonth = (months) => months.find((m) => m.month === dash.params().month) || months.find((m) => m.is_current) || months[months.length - 1];
const step = (dir) => {
  if (S('months').status !== 'ok') return;
  const months = S('months').data;
  const i = months.findIndex((m) => m.month === pickMonth(months).month);
  if (months[i + dir]) dash.setParams({ month: months[i + dir].month, day: null });
};
function bindControls() {
  $('prev-month').addEventListener('click', () => step(-1));
  $('next-month').addEventListener('click', () => step(1));
  $('search').addEventListener('input', (e) => { search = e.target.value; drawActivityRows(); });
  document.querySelectorAll('.xp-nav a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = $(a.dataset.go);
    if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); dash.setLink(a.dataset.go); }
  }));
  const lockNow = () => window.xpLock && window.xpLock.lockNow();
  $('lock-now').addEventListener('click', lockNow);
  $('lock-now-2').addEventListener('click', lockNow);
  $('change-pin').addEventListener('click', () => window.xpLock && window.xpLock.changePin());
}
const setCat = (cat) => dash.setParams({ cat: dash.params().cat === cat ? null : cat });

// ── Header ─────────────────────────────────────────────────────
function drawHeader(months, mo, tot, pl) {
  const label = $('month-label');
  const i = months.indexOf(mo);
  $('prev-month').disabled = i <= 0;
  $('next-month').disabled = i < 0 || i >= months.length - 1;
  label.replaceChildren(h('span', { mark: ['months', 'label', { month: mo.month }], text: mo.label }));
  const take = $('takeaway');
  if (!tot) {
    const st = S('totals').status;
    if (st === 'error' || st === 'missing') take.replaceChildren('Couldn’t read your sheet just now.');
    else if (st === 'connect') take.replaceChildren('Waiting for your Google Drive connection.');
    else if (!take.querySelector('.dash-skeleton')) take.replaceChildren(h('span', { class: 'dash-skeleton', text: 'Reading your sheet' }));
    return;
  }
  const where = { month: mo.month };
  const spent = h('b', { mark: ['totals', 'spent', where], text: RM(tot.spent) });
  const days = () => [h('b', { mark: ['months', 'days_left', where], text: String(mo.days_left) }), plural(mo.days_left, ' day', ' days'), ' to go.'];
  const name = mo.label.split(' ')[0];
  let parts;
  if (mo.is_current) {
    if (pl && pl.status === 'Over plan') parts = [spent, ' spent so far, ', h('b', { mark: ['plan', 'over_plan', where], text: RM(pl.over_plan) }), ' over your plan with ', days()];
    else if (pl && pl.status === 'Ahead of pace') parts = [spent, ' spent so far, ', h('b', { mark: ['plan', 'pct_used', where], text: pctTxt(pl.pct_used) }), ' of your plan with ', days()];
    else if (pl && pl.status === 'On track') parts = [spent, ' spent so far: on track, with ', h('b', { mark: ['plan', 'left', where], text: RM(pl.left) }), ' left in your plan.'];
    else parts = [spent, ' spent so far this month.'];
  } else {
    if (pl && pl.status === 'Over plan') parts = [name + ': ', spent, ' spent, ', h('b', { mark: ['plan', 'over_plan', where], text: RM(pl.over_plan) }), ' over your plan.'];
    else if (pl && pl.status === 'Within plan') parts = [name + ': ', spent, ' spent, with ', h('b', { mark: ['plan', 'left', where], text: RM(pl.left) }), ' of your plan to spare.'];
    else parts = [name + ': ', spent, ' spent.'];
    if (mo.tracked_from > 1) parts.push(' Tracking began on the ', h('span', { mark: ['months', 'tracked_from', where], text: ordinal(mo.tracked_from) }), '.');
  }
  fill(take, parts);
}

// ── Hero: spent, plan ring, stats ──────────────────────────────
function ring(pl, mo) {
  const size = 140;
  const r = 58;
  const len = 2 * Math.PI * r;
  const used = Math.max(0, Math.min(1, (pl.pct_used || 0) / 100));
  const color = pl.status === 'Over plan' ? 'var(--critical)' : pl.status === 'Ahead of pace' ? 'var(--warn)' : 'url(#xp-ring-grad)';
  const glow = pl.status === 'Over plan' ? 'rgba(208,59,59,.55)' : pl.status === 'Ahead of pace' ? 'rgba(250,178,25,.45)' : 'rgba(91,140,255,.55)';
  const svg = d3.create('svg').attr('viewBox', `0 0 ${size} ${size}`).attr('aria-hidden', 'true');
  const grad = svg.append('defs').append('linearGradient').attr('id', 'xp-ring-grad').attr('x1', 0).attr('y1', 0).attr('x2', 1).attr('y2', 1);
  grad.append('stop').attr('offset', 0).style('stop-color', '#3ad6c6');
  grad.append('stop').attr('offset', 1).style('stop-color', '#5b8cff');
  const g = svg.append('g').attr('transform', `rotate(-90 ${size / 2} ${size / 2})`);
  g.append('circle').attr('cx', size / 2).attr('cy', size / 2).attr('r', r).style('fill', 'none').style('stroke', 'rgba(255,255,255,.08)').style('stroke-width', 11);
  if (used > 0) {
    g.append('circle').attr('class', 'arc').attr('cx', size / 2).attr('cy', size / 2).attr('r', r)
      .style('fill', 'none').style('stroke', color).style('stroke-width', 11).style('stroke-linecap', 'round')
      .style('stroke-dasharray', `${Math.max(0.001, used * len)} ${len}`).style('--len', used * len)
      .style('filter', `drop-shadow(0 0 7px ${glow})`);
  }
  if (mo.is_current) {
    const a = (mo.pct_month / 100) * 2 * Math.PI;
    const c = size / 2;
    g.append('line').attr('x1', c + (r - 10) * Math.cos(a)).attr('y1', c + (r - 10) * Math.sin(a)).attr('x2', c + (r + 10) * Math.cos(a)).attr('y2', c + (r + 10) * Math.sin(a))
      .style('stroke', '#f2f5fb').style('stroke-width', 2.5).style('stroke-linecap', 'round');
  }
  return svg.node();
}

function drawHero(months, mo, tot, pl) {
  const box = $('hero');
  if (notReady(box, ['totals', 'months'])) return;
  const where = { month: mo.month };
  const planSt = S('plan').status;
  const chip = pl ? statusChip(pl.status, ['plan', 'status', where])
    : planSt === 'loading' ? h('span', { class: 'xp-chip dash-skeleton', text: 'Status' })
    : h('span', { class: 'xp-chip', style: { '--st': 'var(--ink-3)' } }, icon('tag'), 'Budget plan unavailable');
  const main = h('div', { class: 'xp-hero-main' },
    h('div', { class: 'xp-label', text: mo.is_current ? 'Spent this month' : 'Spent in ' + mo.label.split(' ')[0] }),
    h('div', { class: 'xp-big', mark: ['totals', 'spent', where] }, h('span', { class: 'cur', text: tot.spent < 0 ? '-RM' : 'RM' }), nf2.format(Math.abs(tot.spent))),
    h('div', { class: 'xp-sub' },
      h('b', { mark: ['totals', 'entries', where], text: String(tot.entries) }), plural(tot.entries, ' entry', ' entries'),
      mo.is_current ? [' · day ', h('b', { mark: ['months', 'as_of_day', where], text: String(mo.as_of_day) }), ' of ', h('span', { mark: ['months', 'days', where], text: String(mo.days) })]
        : mo.tracked_from > 1 ? [' · tracked from the ', h('span', { mark: ['months', 'tracked_from', where], text: ordinal(mo.tracked_from) })] : ' · whole month'),
    chip);
  const top = h('div', { class: 'xp-hero-top' }, main);
  if (pl && pl.plan != null) {
    top.append(h('div', { class: 'xp-ring', role: 'img', 'aria-label': pctTxt(pl.pct_used) + ' of plan used' + (mo.is_current ? ', ' + mo.pct_month + '% of the month gone' : '') },
      ring(pl, mo),
      h('div', { class: 'xp-ringc' },
        h('div', { class: 'xp-ringv', mark: ['plan', 'pct_used', where], text: pctTxt(pl.pct_used) }),
        h('div', { class: 'xp-ringl' }, 'of ', h('span', { mark: ['plan', 'plan', where], text: RM(pl.plan) }), h('br'), 'plan used'))));
  }
  const stat = (label, value, sub, bad) => h('div', { class: 'xp-stat' }, h('div', { class: 'xp-label', text: label }), h('div', { class: 'v' + (bad ? ' is-bad' : '') }, value), h('div', { class: 's' }, sub));
  const projected = (sub, bad) => stat('Projected', h('span', { mark: ['totals', 'projected', where], text: RM(tot.projected) }), sub, bad);
  let stats = [];
  if (pl && pl.plan != null && mo.is_current) {
    stats = [
      pl.left >= 0
        ? stat('Left in plan', h('span', { mark: ['plan', 'left', where], text: RM(pl.left) }), 'left to spend')
        : stat('Over plan', h('span', { mark: ['plan', 'over_plan', where], text: RM(pl.over_plan) }), 'above your plan', true),
      stat('Safe per day', h('span', { mark: ['plan', 'safe_per_day', where], text: RM(pl.safe_per_day) }), pl.safe_per_day == null ? 'plan used up' : [h('span', { mark: ['months', 'days_left', where], text: String(mo.days_left) }), plural(mo.days_left, ' day left', ' days left')]),
      projected([h('span', { mark: ['plan', 'projected_vs_plan', where], text: RMsigned(pl.projected_vs_plan) }), ' vs plan'], pl.projected_vs_plan > 0),
    ];
  } else if (pl && pl.plan != null) {
    stats = [
      stat('Plan', h('span', { mark: ['plan', 'plan', where], text: RM(pl.plan) }), 'sum of budgets'),
      pl.left >= 0
        ? stat('Left over', h('span', { mark: ['plan', 'left', where], text: RM(pl.left) }), 'under your plan')
        : stat('Over plan', h('span', { mark: ['plan', 'over_plan', where], text: RM(pl.over_plan) }), 'above your plan', true),
      stat('Unplanned', h('span', { mark: ['plan', 'unplanned', where], text: RM(pl.unplanned) }), 'no budget line'),
    ];
  } else if (mo.is_current) {
    stats = [projected('at this month’s pace'), stat('One-offs', h('span', { mark: ['totals', 'one_offs', where], text: RM(tot.one_offs) }), 'entries of RM100+'), stat('Saved', h('span', { mark: ['totals', 'saved', where], text: RM(tot.saved) }), 'in Simpanan')];
  }
  const kids = [top];
  if (stats.length) kids.push(h('div', { class: 'xp-stats' }, stats));
  const prev = months[months.indexOf(mo) - 1];
  const notes = [];
  if (mo.is_current && tot.one_offs > 0) notes.push(['Projection counts the month’s entries of RM100 or more once (', h('b', { mark: ['totals', 'one_offs', where], text: RM(tot.one_offs) }), ') and extends everyday spending at its current pace.']);
  if (tot.last_month_same_point != null) notes.push([mo.is_current ? 'Vs this point last month: ' : 'Vs the month before: ', h('b', { mark: ['totals', 'vs_last_month', where], text: RMsigned(tot.vs_last_month) }), ' (', h('span', { mark: ['totals', 'last_month_same_point', where], text: RM(tot.last_month_same_point) }), ' then).']);
  else if (prev && prev.tracked_from > 1) notes.push(['No month-on-month comparison yet: tracking began on ', h('span', { mark: ['months', 'tracked_from', { month: prev.month }], text: String(prev.tracked_from) }), ' ' + MON[+prev.month.slice(5) - 1] + '.']);
  notes.forEach((n) => kids.push(h('p', { class: 'xp-heronote' }, n)));
  box.replaceChildren(...kids);
}

// ── Highlights ─────────────────────────────────────────────────
function drawInsights(months, mo, tot, pl, cats, uses, merchants, daily, methods) {
  const box = $('insights');
  const ok = (id) => S(id).status === 'ok';
  if (!ok('totals') || !ok('categories')) {
    const failed = ['error', 'missing'].includes(S('totals').status);
    if (failed) box.replaceChildren(h('div', { class: 'xp-ins is-plain' }, h('div', { class: 'xp-fail', text: 'Failed to load' })));
    else if (!box.querySelector('.dash-skeleton')) box.replaceChildren(...[0, 1, 2].map(() => h('div', { class: 'xp-ins is-plain' }, h('span', { class: 'dash-skeleton', text: 'Highlight' }))));
    return;
  }
  const where = { month: mo.month };
  const when = mo.is_current ? ' this month.' : ' in ' + mo.label.split(' ')[0] + '.';
  const card = (kicker, ic, color, body) => h('div', { class: 'xp-ins', style: { '--ic': color } }, h('span', { class: 'xp-iico' }, icon(ic)), h('div', null, h('span', { class: 'k', text: kicker }), h('p', null, body)));
  const out = [];
  const risky = uses.filter((u) => u.budget != null && ['Over budget', 'Used up', 'Nearly used', 'Ahead of pace'].includes(u.status)).sort((a, b) => b.pct_used - a.pct_used)[0];
  if (risky) {
    const w = { month: mo.month, category: risky.category };
    const over = risky.status === 'Over budget';
    out.push(card(over ? 'Over budget' : 'Watch', over ? 'over' : 'alert', over ? 'var(--critical)' : 'var(--warn)', [
      h('b', { text: risky.category }), ' has used ', h('b', { mark: ['budget_use', 'pct_used', w], text: pctTxt(risky.pct_used) }), ' of its ', h('b', { mark: ['budget_use', 'budget', w], text: RM(risky.budget) }), ' budget',
      mo.is_current && mo.days_left > 0 ? [', with ', h('b', { mark: ['months', 'days_left', where], text: String(mo.days_left) }), plural(mo.days_left, ' day', ' days'), ' to go.'] : '.']));
  }
  if (pl && pl.unplanned > 0) {
    const nob = cats.filter((c) => c.category !== 'Simpanan' && c.spent > 0 && !uses.some((u) => u.category === c.category && u.budget != null)).sort((a, b) => b.spent - a.spent);
    out.push(card('Unplanned', 'bolt', nob[0] ? catInfo(nob[0].category).c : 'var(--c7)', [
      h('b', { mark: ['plan', 'unplanned', where], text: RM(pl.unplanned) }),
      nob.length === 1 ? [' went to ', h('b', { text: nob[0].category }), ', which has no line in your budget plan.'] : [' went to categories with no line in your budget plan, mostly ', h('b', { text: nob[0] ? nob[0].category : 'other' }), '.']]));
  }
  const habit = merchants.filter((m) => m.visits >= 2).sort((a, b) => b.visits - a.visits || b.spent - a.spent)[0];
  if (habit) {
    const w = { key: habit.key };
    out.push(card('Habit', 'repeat', catInfo(habit.category).c, [h('b', { mark: ['merchants', 'merchant', w], text: habit.merchant }), ': ', h('b', { mark: ['merchants', 'visits', w], text: String(habit.visits) }), ' visits, ', h('b', { mark: ['merchants', 'spent', w], text: RM(habit.spent) }), when]));
  }
  const top = daily.filter((d) => d.spent > 0).sort((a, b) => b.spent - a.spent)[0];
  if (top) {
    const w = { date: top.date };
    out.push(card('Biggest day', 'calendar', 'var(--total)', [h('b', { text: dayLong(top.date) }), ': ', h('b', { mark: ['daily', 'spent', w], text: RM(top.spent) }), ' across ', h('span', { mark: ['daily', 'entries', w], text: String(top.entries) }), plural(top.entries, ' entry.', ' entries.')]));
  }
  const cc = methods.find((m) => m.method === 'Credit Card');
  if (cc && cc.spent > 0) {
    const w = { key: cc.key };
    out.push(card('On your card', 'card', 'var(--total)', [h('b', { mark: ['methods', 'spent', w], text: RM(cc.spent) }), ' went on your credit card, ', h('b', { mark: ['methods', 'share', w], text: cc.share.toFixed(1) + '%' }), ' of the month’s spending.']));
  }
  if (out.length < 3 && pl && pl.plan != null && mo.is_current && tot.spent <= 0) {
    out.push(card('Fresh month', 'spark', 'var(--brand-c)', [h('b', { mark: ['plan', 'plan', where], text: RM(pl.plan) }), ' to plan with, about ', h('b', { mark: ['plan', 'safe_per_day', where], text: RM(pl.safe_per_day) }), ' a day.']));
  }
  const prev = months[months.indexOf(mo) - 1];
  const prevTot = prev && S('totals').data.find((t) => t.month === prev.month);
  if (out.length < 3 && prevTot) {
    const w = { month: prev.month };
    out.push(card('Last month', 'calendar', 'var(--brand-a)', [h('b', { text: prev.label.split(' ')[0] }), ' closed at ', h('b', { mark: ['totals', 'spent', w], text: RM(prevTot.spent) }), ' across ', h('span', { mark: ['totals', 'entries', w], text: String(prevTot.entries) }), plural(prevTot.entries, ' entry.', ' entries.')]));
  }
  if (out.length < 3) out.push(card('Tip', 'spark', 'var(--brand-b)', mo.is_current ? 'Log expenses from your Shortcut and this page fills in as you go.' : 'Pick another month with the arrows at the top.'));
  while (out.length < 3) out.push(card('Tip', 'spark', 'var(--brand-b)', 'Tap a day in the calendar or a category in the breakdown to dig in.'));
  box.replaceChildren(...out.slice(0, 3));
}

// ── Budgets ────────────────────────────────────────────────────
function drawBudgets(mo, cats, uses) {
  const box = $('budget-list');
  const note = $('budgets-note');
  const useSt = S('budget_use').status;
  const unmatched = S('budget_map').status === 'ok' && !S('budget_map').data.length && S('budget_plan').status === 'ok' && S('budget_plan').data.some((b) => b.line !== 'Net Income');
  note.replaceChildren(...(unmatched ? ['Your budget lines aren’t matched to categories yet · tap “Match lines”']
    : useSt === 'error' || useSt === 'missing' ? ['Couldn’t read your budget sheet just now: showing spending only']
    : mo.is_current && S('months').status === 'ok' ? ['Against your budget plan · the tick marks day ', h('span', { mark: ['months', 'as_of_day', { month: mo.month }], text: String(mo.as_of_day) }), ' of ', h('span', { mark: ['months', 'days', { month: mo.month }], text: String(mo.days) })]
    : ['Against your budget plan · whole month']));
  if (notReady(box, ['categories', 'months'], 6)) return;
  const useOf = new Map(uses.map((u) => [u.category, u]));
  const rows = cats.map((c) => {
    const w = { month: mo.month, category: c.category };
    const u = useOf.get(c.category) || null;
    const info = catInfo(c.category);
    const isSave = c.category === 'Simpanan';
    const hasBudget = u && u.budget != null;
    const sv = isSave && S('savings').status === 'ok' ? S('savings').data.find((x) => x.month === mo.month) : null;
    if (sv) {
      const sw = { month: mo.month };
      const track = h('div', { class: 'xp-track' }, h('i', { class: 'xp-fill', style: { width: Math.max(0, Math.min(100, sv.pct_left)) + '%' } }));
      return h('div', { class: 'xp-brow', style: { '--cc': info.c } },
        h('span', { class: 'xp-ico' }, icon(info.icon)),
        h('span', { class: 'xp-bname', text: c.category }),
        h('span', { class: 'xp-bval' }, h('span', { mark: ['savings', 'left_over', sw], text: RM(sv.left_over) }), h('span', { class: 'of', text: ' / ' }), h('span', { class: 'of', mark: ['savings', 'income', sw], text: RM(sv.income) })),
        track,
        h('div', { class: 'xp-bmeta' },
          h('span', null, 'Net income minus all spending', mo.is_current ? [' · at this pace ', h('span', { mark: ['savings', 'left_at_pace', sw], text: RM(sv.left_at_pace) })] : ''),
          h('span', { class: 'xp-st-stack' },
            h('span', { class: 'st', style: { '--st': sv.left_over >= 0 ? 'var(--good)' : 'var(--critical)' } }, icon(sv.left_over >= 0 ? 'coins' : 'over'), h('span', { mark: ['savings', 'pct_left', sw], text: pctTxt(sv.pct_left) }), ' left'),
            S('totals').status === 'ok' && S('totals').data.find((t) => t.month === mo.month)
              ? h('span', { class: 'xp-st-val' }, h('b', { mark: ['totals', 'spent', sw], text: RM(S('totals').data.find((t) => t.month === mo.month).spent) }), ' used')
              : null)));
    }
    const value = hasBudget
      ? [h('span', { mark: ['categories', 'spent', w], text: RM(c.spent) }), h('span', { class: 'of', text: ' / ' }), h('span', { class: 'of', mark: ['budget_use', 'budget', w], text: RM(u.budget) })]
      : h('span', { mark: ['categories', 'spent', w], text: RM(c.spent) });
    const track = h('div', { class: 'xp-track' });
    if (hasBudget && u.pct_used > 0) track.append(h('i', { class: 'xp-fill' + (u.pct_used > 100 ? ' is-over' : ''), style: { width: Math.min(100, u.pct_used) + '%' } }));
    if (hasBudget && mo.is_current) track.append(h('i', { class: 'xp-pace', style: { left: mo.pct_month + '%' } }));
    const left = hasBudget ? [h('span', { mark: ['budget_use', 'pct_used', w], text: pctTxt(u.pct_used) }), ' used']
      : isSave ? 'Saved, not counted as spending'
      : c.share != null && c.spent !== 0 ? [u ? 'No budget line · ' : '', h('span', { mark: ['categories', 'share', w], text: c.share.toFixed(1) + '%' }), ' of spending'] : u ? 'No budget line' : '';
    const st = u ? STATUS[u.status] || STATUS['No budget'] : null;
    return h('div', { class: 'xp-brow' + (u && !hasBudget && !isSave ? ' is-nobudget' : ''), style: { '--cc': info.c } },
      h('span', { class: 'xp-ico' }, icon(info.icon)),
      h('span', { class: 'xp-bname', text: c.category }),
      h('span', { class: 'xp-bval' }, value),
      track,
      h('div', { class: 'xp-bmeta' }, h('span', null, left), st ? h('span', { class: 'st', style: { '--st': st.c } }, icon(st.icon), h('span', { mark: ['budget_use', 'status', w], text: u.status })) : null));
  });
  box.replaceChildren(...rows);
}

// ── Month so far: running total vs plan pace, with spend per day beneath ──
const wideLayout = () => root.clientWidth >= 720;
const fillHeight = (cardId, chartBox, fallback, extra) => {
  if (!wideLayout()) return fallback;
  const card = $(cardId);
  const mine = chartBox.closest('.xp-card');
  if (!card || !mine) return fallback;
  const head = chartBox.getBoundingClientRect().top - mine.getBoundingClientRect().top;
  return Math.max(fallback, Math.min(560, Math.floor(card.getBoundingClientRect().height - head - 18 - (extra || 0))));
};
function drawBurnup(months, mo, tot, pl, daily) {
  const box = $('burnup-chart');
  const legend = $('burnup-legend');
  if (notReady(box, ['daily', 'totals', 'months'])) { legend.replaceChildren(); return; }
  const rows = daily.filter((d) => d.month === mo.month);
  const prev = months[months.indexOf(mo) - 1];
  const prevRows = tot && tot.last_month_same_point != null && prev ? daily.filter((d) => d.month === prev.month && d.day <= mo.days) : [];
  const planTotal = pl ? pl.plan : null;
  const x0 = mo.tracked_from - 1;
  const planEnd = planTotal == null ? null : (planTotal * (mo.days - x0)) / mo.days;
  fill(legend,
    h('span', null, h('i', { style: { '--lc': 'var(--total)' } }), mo.is_current ? 'This month' : mo.label.split(' ')[0]),
    planEnd != null ? h('span', null, h('i', { class: 'dash', style: { '--lc': 'var(--ink-3)' } }), x0 > 0 ? 'Plan pace from day ' + mo.tracked_from : 'Plan pace') : null,
    prevRows.length ? h('span', null, h('i', { style: { '--lc': '#5d6780' } }), prev.label.split(' ')[0]) : null);
  $('burnup-note').textContent = planEnd != null ? 'Running total against a steady pace to your plan' : 'Running total for the month';
  box.replaceChildren();
  const W = Math.max(280, box.clientWidth || 320);
  const BARS = 92;
  const H = fillHeight('budgets', box, W < 480 ? 196 : 224, BARS);
  const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
    .attr('aria-label', 'Running total of spending by day' + (planEnd != null ? ', against a steady pace to the plan' : ''));
  const defs = svg.append('defs');
  const lg = defs.append('linearGradient').attr('id', 'xp-burn-fill').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
  [[0, 0.26], [0.25, 0.16], [0.5, 0.08], [0.75, 0.03], [1, 0]].forEach(([o, a]) => lg.append('stop').attr('offset', o).style('stop-color', '#e6eeff').style('stop-opacity', a));
  defs.append('filter').attr('id', 'xp-burn-glow').attr('x', '-10%').attr('y', '-30%').attr('width', '120%').attr('height', '160%').append('feGaussianBlur').attr('stdDeviation', 3.5);
  const top = Math.max(planEnd || 0, d3.max(rows, (d) => d.running_total) || 0, d3.max(prevRows, (d) => d.running_total) || 0, 10);
  const y = d3.scaleLinear([0, top * 1.1], [H - 6, 14]).nice(4);
  const ticks = y.ticks(4);
  const ml = Math.ceil(d3.max(ticks, (t) => textW(svg, RMaxis(t), 'xp-axis-t')) || 30) + 12;
  const mr = 10;
  const x = d3.scaleLinear([x0, mo.days], [ml, W - mr]);
  const axis = svg.append('g').attr('class', 'xp-axis');
  ticks.forEach((t) => {
    axis.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(t)).attr('y2', y(t)).style('stroke', t === 0 ? 'var(--axis)' : 'var(--grid)').style('stroke-width', 1);
    axis.append('text').attr('x', ml - 8).attr('y', y(t)).attr('dy', '0.32em').attr('text-anchor', 'end').text(RMaxis(t));
  });
  if (planEnd != null) svg.append('line').attr('x1', x(x0)).attr('y1', y(0)).attr('x2', x(mo.days)).attr('y2', y(planEnd)).style('stroke', 'var(--ink-3)').style('stroke-width', 1.5).style('stroke-dasharray', '5 4');
  if (prevRows.length) {
    svg.append('path').datum([{ day: x0, running_total: 0 }, ...prevRows]).attr('d', d3.line().x((d) => x(d.day)).y((d) => y(d.running_total)))
      .style('fill', 'none').style('stroke', '#5d6780').style('stroke-width', 1.5).style('stroke-linejoin', 'round').style('stroke-linecap', 'round');
  }
  const pts = [{ day: x0, running_total: 0 }, ...rows];
  const line = d3.line().x((d) => x(d.day)).y((d) => y(d.running_total));
  svg.append('path').datum(pts).attr('d', d3.area().x((d) => x(d.day)).y0(y(0)).y1((d) => y(d.running_total))).style('fill', 'url(#xp-burn-fill)');
  svg.append('path').datum(pts).attr('d', line).style('fill', 'none').style('stroke', 'rgba(170,195,255,.55)').style('stroke-width', 5).style('filter', 'url(#xp-burn-glow)');
  const path = svg.append('path').datum(pts).attr('class', 'xp-burn-line').attr('d', line).style('fill', 'none').style('stroke', 'var(--total)').style('stroke-width', 2.25).style('stroke-linejoin', 'round').style('stroke-linecap', 'round');
  const plen = path.node().getTotalLength ? path.node().getTotalLength() : 0;
  path.style('stroke-dasharray', plen + ' ' + plen).style('--len', plen);
  const last = pts[pts.length - 1];
  const lx = x(last.day);
  const ly = y(last.running_total);
  svg.append('circle').attr('cx', lx).attr('cy', ly).attr('r', 4.5).style('fill', 'var(--total)').style('stroke', 'var(--card)').style('stroke-width', 2);
  const endText = RM(last.running_total);
  const ew = textW(svg, endText, 'xp-endlabel');
  const right = lx + 10 + ew < W - mr;
  const ey = ly - 10 < 16 ? ly + 18 : ly - 10;
  if (planEnd != null) {
    const pt = 'Plan ' + RM(planTotal);
    const pw = textW(svg, pt, 'xp-reflabel');
    let py = y(planEnd) - 8;
    if (Math.abs(py - ey) < 15 && (right ? lx + 10 + ew : lx) > W - mr - pw - 6) py = y(planEnd) + 16;
    svg.append('text').attr('class', 'xp-reflabel').attr('x', W - mr).attr('y', Math.max(12, py)).attr('text-anchor', 'end').text(pt);
  }
  svg.append('text').attr('class', 'xp-endlabel').attr('x', right ? lx + 10 : lx - 10).attr('y', ey).attr('text-anchor', right ? 'start' : 'end').text(endText);

  // Spend per day, on the same day axis
  const bars = d3.select(box).append('svg').attr('class', 'xp-daybars').attr('width', '100%').attr('viewBox', `0 0 ${W} ${BARS}`).attr('role', 'img').attr('aria-label', 'Spent per day');
  const maxDay = d3.max(rows, (d) => d.spent) || 0;
  const yb = d3.scaleLinear([0, maxDay || 1], [BARS - 22, 16]);
  const bw = Math.max(2, Math.min(12, (x(1) - x(0)) * 0.62));
  const ba = bars.append('g').attr('class', 'xp-axis');
  ba.append('text').attr('x', ml - 8).attr('y', 12).attr('text-anchor', 'end').text('Per day');
  ba.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', BARS - 22).attr('y2', BARS - 22).style('stroke', 'var(--axis)');
  const xt = [mo.tracked_from, ...[8, 15, 22, 29].filter((d) => d >= mo.tracked_from + 4 && d <= mo.days)];
  xt.forEach((d, i) => ba.append('text').attr('x', x(d)).attr('y', BARS - 5).attr('text-anchor', i === 0 ? 'start' : 'middle').text(i === 0 ? d + ' ' + MON[+mo.month.slice(5) - 1] : d));
  const biggest = rows.reduce((b, d) => (d.spent > (b ? b.spent : 0) ? d : b), null);
  rows.filter((d) => d.spent > 0).forEach((d) => {
    bars.append('path').attr('class', 'xp-bar').attr('d', roundedTop(x(d.day) - bw / 2, yb(d.spent), bw, yb(0), 3))
      .style('fill', 'var(--total)').style('opacity', d === biggest ? 1 : 0.55);
  });
  if (biggest) {
    const bt = RM(biggest.spent);
    const bwid = textW(bars, bt, 'xp-reflabel');
    const bx = Math.max(ml + bwid / 2, Math.min(W - mr - bwid / 2, x(biggest.day)));
    bars.append('text').attr('class', 'xp-reflabel').attr('x', bx).attr('y', yb(biggest.spent) - 5).attr('text-anchor', 'middle').text(bt);
  }

  // Hover: crosshair + tooltip for the nearest day, across both charts
  const tip = h('div', { class: 'xp-tip' });
  box.append(tip);
  const cross = svg.append('line').attr('y1', 12).attr('y2', H - 6).style('stroke', 'rgba(255,255,255,.25)').style('stroke-width', 1).style('opacity', 0);
  const dot = svg.append('circle').attr('r', 5).style('fill', 'var(--total)').style('stroke', 'var(--card)').style('stroke-width', 2).style('opacity', 0);
  const hide = () => { tip.classList.remove('on'); cross.style('opacity', 0); dot.style('opacity', 0); };
  const show = (event, sel, yOf) => {
    if (!rows.length) return;
    const [px] = d3.pointer(event, sel.node());
    const day = Math.max(rows[0].day, Math.min(rows[rows.length - 1].day, Math.round(x.invert(px))));
    const d = rows.find((r) => r.day === day);
    if (!d) return hide();
    const p = prevRows.find((r) => r.day === day);
    cross.attr('x1', x(day)).attr('x2', x(day)).style('opacity', 1);
    dot.attr('cx', x(day)).attr('cy', y(d.running_total)).style('opacity', 1);
    fill(tip, h('div', { class: 't', text: dayLong(d.date) }),
      h('div', { class: 'r', style: { '--lc': 'var(--total)' } }, h('i'), 'Running total ', h('b', { text: RM(d.running_total) })),
      h('div', { class: 'r' }, 'Spent that day ', h('b', { text: RM(d.spent) }), d.entries ? ' · ' + d.entries + plural(d.entries, ' entry', ' entries') : ''),
      p ? h('div', { class: 'r', style: { '--lc': '#5d6780' } }, h('i'), MON[+prev.month.slice(5) - 1] + ' by this day ', h('b', { text: RM(p.running_total) })) : null);
    tip.classList.add('on');
    const scale = box.clientWidth / W;
    placeTip(box, tip, x(day) * scale, yOf(d) * scale);
  };
  svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml - mr).attr('height', H).style('fill', 'transparent').style('cursor', 'crosshair')
    .on('pointermove', (event) => show(event, svg, (d) => y(d.running_total))).on('pointerleave', hide);
  bars.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml - mr).attr('height', BARS - 20).style('fill', 'transparent').style('cursor', 'crosshair')
    .on('pointermove', (event) => show(event, bars, () => H + 10)).on('pointerleave', hide);
}

// ── Where it goes: donut + legend ──────────────────────────────
function drawDonut(mo, tot, cats) {
  const box = $('donut');
  if (notReady(box, ['categories', 'totals'])) return;
  const pick = dash.params().cat;
  const rows = cats.filter((c) => c.category !== 'Simpanan' && c.spent > 0);
  if (!rows.length) { box.replaceChildren(h('p', { class: 'xp-empty', text: 'No spending logged this month yet.' })); return; }
  const size = Math.max(150, Math.min(196, (box.clientWidth || 300) - 8));
  const ro = size / 2;
  const ri = ro * 0.7;
  const wrap = h('div', { class: 'xp-donut', style: { width: size + 'px', height: size + 'px' } });
  const svg = d3.select(wrap).append('svg').attr('width', size).attr('height', size).attr('viewBox', `${-ro} ${-ro} ${size} ${size}`).attr('role', 'img').attr('aria-label', 'Share of spending by category');
  const pie = d3.pie().value((d) => d.spent).sort(null).padAngle(0.022);
  const arc = d3.arc().innerRadius(ri).outerRadius(ro).cornerRadius(3);
  const arcHi = d3.arc().innerRadius(ri).outerRadius(ro + 5).cornerRadius(3);
  const tip = h('div', { class: 'xp-tip' });
  svg.selectAll('path').data(pie(rows)).join('path')
    .attr('d', (d) => (pick === d.data.category ? arcHi(d) : arc(d)))
    .style('fill', (d) => catInfo(d.data.category).c)
    .style('opacity', (d) => (pick && pick !== d.data.category ? 0.3 : 1))
    .style('cursor', 'pointer')
    .on('pointermove', (event, d) => {
      fill(tip, h('div', { class: 't', text: d.data.category }), h('div', null, h('b', { text: RM(d.data.spent) }), ' · ' + d.data.share.toFixed(1) + '%'));
      tip.classList.add('on');
      const [px, py] = d3.pointer(event, wrap);
      placeTip(wrap, tip, px, py);
    })
    .on('pointerleave', () => tip.classList.remove('on'))
    .on('click', (event, d) => setCat(d.data.category));
  wrap.append(h('div', { class: 'xp-donutc' }, h('div', { class: 'v', mark: ['totals', 'spent', { month: mo.month }], text: RM(tot.spent) }), h('div', { class: 'l', text: 'spent' })), tip);
  wrap.style.position = 'relative';
  const legend = h('div', { class: 'xp-dlegend' + (pick ? ' has-pick' : '') }, rows.map((c) => {
    const w = { month: mo.month, category: c.category };
    return h('button', { type: 'button', class: 'xp-drow', 'aria-pressed': String(pick === c.category), style: { '--cc': catInfo(c.category).c }, onclick: () => setCat(c.category) },
      h('span', { class: 'xp-dot' }), h('span', { class: 'n', text: c.category }),
      h('span', { class: 'a', mark: ['categories', 'spent', w], text: RM(c.spent) }),
      h('span', { class: 'p', mark: ['categories', 'share', w], text: c.share.toFixed(1) + '%' }));
  }));
  box.replaceChildren(wrap, legend);
}

// ── Merchants ──────────────────────────────────────────────────
function listRows(items, color, hideCat) {
  const max = d3.max(items, (m) => Math.abs(m.spent)) || 1;
  return items.map((m, i) => {
    const w = { key: m.key };
    return h('div', { class: 'xp-mrow', style: { '--cc': color || catInfo(m.category).c } },
      h('span', { class: 'xp-rank', text: String(i + 1) }),
      h('span', { class: 'xp-mname' }, h('i', { class: 'xp-dot' }), h('span', { mark: ['merchants', 'merchant', w], text: m.merchant })),
      h('span', { class: 'xp-mamt', mark: ['merchants', 'spent', w], text: RM(m.spent) }),
      h('div', { class: 'xp-mbar' }, h('i', { style: { width: Math.max(2, (Math.max(0, m.spent) / max) * 100) + '%' } })),
      h('div', { class: 'xp-msub' }, h('span', { mark: ['merchants', 'visits', w], text: String(m.visits) }), plural(m.visits, ' visit', ' visits'), color || hideCat ? '' : ' · ' + m.category));
  });
}
function drawMerchants(mo, merchants) {
  const box = $('merchant-list');
  const note = $('merchants-note');
  if (notReady(box, ['merchants'], 5)) return;
  const pick = dash.params().cat;
  const rows = merchants.filter((m) => !pick || m.category === pick).sort((a, b) => b.spent - a.spent).slice(0, 6);
  note.textContent = pick ? 'Biggest totals in ' + pick + ' this month' : 'Biggest totals this month';
  const kids = [];
  if (pick) kids.push(h('div', { class: 'xp-pickline' }, h('span', { text: 'Filtered to ' + pick }), h('button', { type: 'button', class: 'xp-clear', text: 'Show all', onclick: () => dash.setParams({ cat: null }) })));
  kids.push(...(rows.length ? listRows(rows, null, !!pick) : [h('p', { class: 'xp-empty', text: 'Nothing logged here this month.' })]));
  box.replaceChildren(...kids);
}

// ── Inside Lain-lain ───────────────────────────────────────────
function drawLainlain(mo, merchants, cats) {
  const box = $('lainlain-list');
  if (notReady(box, ['merchants', 'categories'], 4)) return;
  const cat = cats.find((c) => c.category === 'Lain-lain');
  const items = merchants.filter((m) => m.category === 'Lain-lain').sort((a, b) => b.spent - a.spent);
  if (!cat || !items.length) { box.replaceChildren(h('p', { class: 'xp-empty', text: 'Nothing in Lain-lain this month.' })); return; }
  const w = { month: mo.month, category: 'Lain-lain' };
  box.replaceChildren(
    h('div', { class: 'xp-total-line' }, h('span', null, cat.share != null ? [h('span', { mark: ['categories', 'share', w], text: cat.share.toFixed(1) + '%' }), ' of spending · no budget line'] : 'No budget line'), h('b', { mark: ['categories', 'spent', w], text: RM(cat.spent) })),
    ...listRows(items, 'var(--c7)'));
}

// ── Card vs QR vs cash ─────────────────────────────────────────
function drawMethods(mo, methods) {
  const box = $('method-list');
  if (notReady(box, ['methods'], 3)) return;
  const rows = methods.slice().sort((a, b) => b.spent - a.spent);
  if (!rows.length) { box.replaceChildren(h('p', { class: 'xp-empty', text: 'No spending logged this month yet.' })); return; }
  box.replaceChildren(h('div', { class: 'xp-mtiles' }, rows.map((m) => {
    const w = { key: m.key };
    return h('div', { class: 'xp-mtile' },
      h('span', { class: 'xp-micon' }, icon(METHOD_ICON[m.method] || 'wallet')),
      h('div', null, h('div', { class: 'nm', text: m.method }), h('div', { class: 'sb' }, h('span', { mark: ['methods', 'entries', w], text: String(m.entries) }), plural(m.entries, ' entry', ' entries'))),
      h('div', null, h('div', { class: 'am', mark: ['methods', 'spent', w], text: RM(m.spent) }), h('div', { class: 'pc', mark: ['methods', 'share', w], text: m.share == null ? '—' : m.share.toFixed(1) + '%' })),
      h('div', { class: 'bar' }, h('i', { style: { width: Math.max(0, Math.min(100, m.share || 0)) + '%' } })));
  })));
}

// ── Calendar ───────────────────────────────────────────────────
function drawCalendar(mo, daily, expenses) {
  const box = $('cal');
  const detail = $('day-detail');
  if (notReady(box, ['daily'], 5)) { detail.replaceChildren(); return; }
  const rows = daily.filter((d) => d.month === mo.month);
  const byDay = new Map(rows.map((d) => [d.day, d]));
  const max = d3.max(rows, (d) => d.spent) || 0;
  const t = d3.scaleSqrt([0, max || 1], [0.12, 1]).clamp(true);
  const ramp = d3.interpolateRgb('#1b2540', '#eef3ff');
  const [y, m] = mo.month.split('-').map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  let sel = dash.params().day;
  if (!sel || !sel.startsWith(mo.month) || !byDay.has(+sel.slice(8, 10))) {
    const withSpend = rows.filter((d) => d.spent > 0);
    sel = (withSpend[withSpend.length - 1] || rows[rows.length - 1] || {}).date || null;
  }
  const cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => h('span', { class: 'xp-wd', text: d }));
  for (let i = 0; i < offset; i++) cells.push(h('span', { class: 'xp-day is-pad', 'aria-hidden': 'true' }));
  for (let d = 1; d <= mo.days; d++) {
    const row = byDay.get(d);
    if (d < mo.tracked_from) { cells.push(h('span', { class: 'xp-day is-untracked', title: 'Before tracking began', text: String(d) })); continue; }
    if (!row) { cells.push(h('span', { class: 'xp-day is-future', text: String(d) })); continue; }
    const v = row.spent > 0 ? t(row.spent) : 0;
    const bg = row.spent > 0 ? ramp(v) : null;
    const isToday = mo.is_current && d === mo.as_of_day;
    cells.push(h('button', {
      type: 'button', class: 'xp-day' + (isToday ? ' is-today' : '') + (v > 0.8 ? ' is-hot' : ''), 'aria-pressed': String(row.date === sel),
      'aria-label': dayLong(row.date) + ': ' + RM(row.spent) + ', ' + row.entries + plural(row.entries, ' entry', ' entries'),
      title: dayShort(row.date) + ' · ' + RM(row.spent),
      style: Object.assign({ '--d': String(d) }, bg ? { background: bg, color: v > 0.62 ? '#0b1222' : '#dfe6f5' } : {}),
      onclick: () => dash.setParams({ day: row.date }),
    }, String(d)));
  }
  const key = h('div', { class: 'xp-calkey' }, 'Less', ...[0.12, 0.35, 0.58, 0.8, 1].map((v) => h('i', { style: { background: ramp(v) } })), 'More');
  box.replaceChildren(h('div', { class: 'xp-cal', role: 'group', 'aria-label': 'Spending per day in ' + mo.label }, cells), key);
  // Selected day's entries
  const day = rows.find((d) => d.date === sel);
  if (!day) { detail.replaceChildren(); return; }
  const w = { date: day.date };
  const entries = S('expenses').status === 'ok' ? expenses.filter((e) => e.date && e.date.startsWith(day.date) && e.category !== 'Simpanan').sort((a, b) => (a.date < b.date ? 1 : -1)) : [];
  detail.replaceChildren(
    h('div', { class: 'xp-dd-head' }, h('span', { class: 'd' }, dayLong(day.date) + ' · ', h('span', { mark: ['daily', 'entries', w], text: String(day.entries) }), plural(day.entries, ' entry', ' entries')), h('span', { class: 'v', mark: ['daily', 'spent', w], text: RM(day.spent) })),
    entries.length ? h('div', { class: 'xp-dd-list' }, entries.map((e) => h('div', { class: 'xp-dd-row', style: { '--cc': catInfo(catName(e.category)).c } },
      h('i', { class: 'xp-dot' }),
      h('span', { class: 'n' }, h('span', { mark: ['expenses', 'item', { sheet_row: e.sheet_row }], text: e.item || '—' }), ' · ' + e.date.slice(11, 16) + (e.method ? ' · ' + e.method : '')),
      h('span', { class: 'a', mark: ['expenses', 'amount', { sheet_row: e.sheet_row }], text: RM(e.amount) })))) : h('p', { class: 'xp-empty', text: 'No entries on this day.' }));
}

// ── Month by month ─────────────────────────────────────────────
function roundedTop(x, yTop, w, yBase, r) {
  const rr = Math.min(r, w / 2, Math.max(0, yBase - yTop));
  return `M${x},${yBase}V${yTop + rr}Q${x},${yTop} ${x + rr},${yTop}H${x + w - rr}Q${x + w},${yTop} ${x + w},${yTop + rr}V${yBase}Z`;
}
function drawMonths(months, mo, totals, plans) {
  const box = $('month-chart');
  const legend = $('months-legend');
  if (notReady(box, ['totals', 'months'])) { legend.replaceChildren(); return; }
  const list = months.slice(-12);
  const data = list.map((m) => {
    const t = totals.find((o) => o.month === m.month);
    const p = plans.find((o) => o.month === m.month);
    return t && { m, ov: Object.assign({}, t, { plan: p ? p.plan : null, status: p ? p.status : '' }) };
  }).filter(Boolean);
  const cur = plans.find((o) => o.month === mo.month) || {};
  const plan = cur.plan ?? null;
  const hasGhost = data.some((d) => d.m.is_current && d.ov.projected > d.ov.spent);
  fill(legend,
    h('span', null, h('i', { class: 'sw', style: { '--lc': 'var(--total)' } }), 'Spent'),
    hasGhost ? h('span', null, h('i', { class: 'sw ghost' }), 'Projected') : null,
    data.some((d) => d.ov.plan != null && d.ov.spent > d.ov.plan) ? h('span', null, h('i', { class: 'sw', style: { '--lc': 'var(--critical)' } }), 'Over plan') : null,
    plan != null ? h('span', null, h('i', { class: 'dash', style: { '--lc': 'var(--ink-3)' } }), 'Plan ', h('span', { mark: ['plan', 'plan', { month: mo.month }], text: RM(plan) })) : null);
  box.replaceChildren();
  const W = Math.max(280, box.clientWidth || 320);
  const H = fillHeight('calendar', box, W < 480 ? 210 : 230, 0);
  const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Total spent per month' + (plan ? ' against the plan' : ''));
  const topV = Math.max(plan || 0, d3.max(data, (d) => Math.max(d.ov.spent, d.m.is_current ? d.ov.projected : 0)) || 0, 10);
  const y = d3.scaleLinear([0, topV * 1.12], [H - 36, 18]).nice(4);
  const ticks = y.ticks(4);
  const ml = Math.ceil(d3.max(ticks, (t) => textW(svg, RMaxis(t), 'xp-axis-t')) || 30) + 12;
  const mr = 8;
  const x = d3.scaleBand(data.map((d) => d.m.month), [ml, W - mr]).paddingInner(0.38).paddingOuter(0.25);
  const bw = Math.min(40, x.bandwidth());
  const axis = svg.append('g').attr('class', 'xp-axis');
  ticks.forEach((t) => {
    axis.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(t)).attr('y2', y(t)).style('stroke', t === 0 ? 'var(--axis)' : 'var(--grid)');
    axis.append('text').attr('x', ml - 8).attr('y', y(t)).attr('dy', '0.32em').attr('text-anchor', 'end').text(RMaxis(t));
  });
  if (plan != null) svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(plan)).attr('y2', y(plan)).style('stroke', 'var(--ink-3)').style('stroke-width', 1.25).style('stroke-dasharray', '5 4').style('pointer-events', 'none');
  const tip = h('div', { class: 'xp-tip' });
  box.append(tip);
  data.forEach(({ m, ov }, idx) => {
    const bx = x(m.month) + (x.bandwidth() - bw) / 2;
    const cx = bx + bw / 2;
    const selected = m.month === mo.month;
    const g = svg.append('g').style('cursor', 'pointer').style('opacity', selected ? 1 : 0.6).on('click', () => dash.setParams({ month: m.month, day: null }));
    const base = y(0);
    const spent = Math.max(0, ov.spent);
    const ghost = m.is_current && ov.projected > spent;
    if (ghost) g.append('path').attr('d', roundedTop(bx + 0.75, y(ov.projected), bw - 1.5, y(spent) - 2, 4)).style('fill', 'rgba(230,238,255,.05)').style('stroke', 'rgba(230,238,255,.5)').style('stroke-width', 1.25).style('stroke-dasharray', '3 3');
    const mPlan = ov.plan;
    const over = mPlan != null && spent > mPlan;
    if (spent > 0) {
      g.append('path').attr('class', 'xp-bar').attr('d', over ? `M${bx},${base}V${y(mPlan)}H${bx + bw}V${base}Z` : roundedTop(bx, y(spent), bw, base, 4))
        .style('fill', 'var(--total)').style('filter', selected ? 'drop-shadow(0 0 10px rgba(200,215,255,.35))' : 'none');
      if (over) g.append('path').attr('class', 'xp-bar').attr('d', roundedTop(bx, y(spent), bw, y(mPlan) - 2, 4)).style('fill', 'var(--critical)');
    }
    if (data.length <= 6 || selected) {
      const label = RM(ov.spent);
      const cls = selected ? 'xp-endlabel' : 'xp-reflabel';
      if (ghost) {
        // spent beside the bar's top, projection above the dashed outline
        const lw = textW(svg, label, cls);
        const side = bx + bw + 6 + lw <= W - mr;
        g.append('text').attr('class', cls).attr('x', side ? bx + bw + 6 : bx - 6).attr('y', Math.max(14, y(spent) + 4)).attr('text-anchor', side ? 'start' : 'end').text(label);
        g.append('text').attr('class', 'xp-reflabel').attr('x', cx).attr('y', y(ov.projected) - 7).attr('text-anchor', 'middle').text('proj. ' + RM(ov.projected));
      } else {
        g.append('text').attr('class', cls).attr('x', cx).attr('y', y(spent) - 7).attr('text-anchor', 'middle').text(label);
      }
    }
    const [yy, mm] = m.month.split('-').map(Number);
    axis.append('text').attr('x', cx).attr('y', H - 20).attr('text-anchor', 'middle').style('fill', selected ? 'var(--ink-1)' : null).text(MON[mm - 1] + (mm === 1 || idx === 0 ? ' ’' + String(yy).slice(2) : ''));
    if (m.tracked_from > 1) axis.append('text').attr('x', cx).attr('y', H - 5).attr('text-anchor', 'middle').style('font-size', '10px').text('from ' + ordinal(m.tracked_from));
    g.append('rect').attr('x', x(m.month)).attr('y', 0).attr('width', x.bandwidth()).attr('height', H - 36).style('fill', 'transparent')
      .on('pointermove', () => {
        fill(tip, h('div', { class: 't', text: m.label }), h('div', null, 'Spent ', h('b', { text: RM(ov.spent) })), m.is_current ? h('div', null, 'Projected ', h('b', { text: RM(ov.projected) })) : null, h('div', null, String(ov.entries) + plural(ov.entries, ' entry', ' entries') + (ov.status ? ' · ' + ov.status : '')));
        tip.classList.add('on');
        const scale = box.clientWidth / W;
        placeTip(box, tip, cx * scale, y(Math.max(spent, m.is_current ? ov.projected : 0)) * scale);
      })
      .on('pointerleave', () => tip.classList.remove('on'));
  });
}

// ── Activity table ─────────────────────────────────────────────
let activityState = { mo: null, rows: [] };
function drawActivityRows() {
  const body = $('tx-body');
  const { mo, rows } = activityState;
  if (!mo) return;
  const pick = dash.params().cat;
  const q = search.trim().toLowerCase();
  const shown = rows.filter((e) => (!pick || catName(e.category) === pick) && (!q || [e.item, catName(e.category), e.method].some((v) => (v || '').toLowerCase().includes(q))));
  if (!shown.length) { body.replaceChildren(h('tr', null, h('td', { colspan: '5' }, h('p', { class: 'xp-empty', text: rows.length ? 'No entries match.' : 'No entries this month yet.' })))); return; }
  body.replaceChildren(...shown.map((e) => h('tr', { 'data-key': String(e.sheet_row), class: e.amount < 0 ? 'is-refund' : null, style: { '--cc': catInfo(catName(e.category)).c } },
    h('td', { class: 'when' }, dayShort(e.date) + ' ', h('span', { class: 'tm', text: e.date.slice(11, 16) })),
    h('td', { class: 'item', 'data-sub': e.category + (e.method ? ' · ' + e.method : ''), text: e.item || '—' }),
    h('td', { class: 'cat wide', text: e.category || '—' }),
    h('td', { class: 'meth wide', text: e.method || '—' }),
    h('td', { class: 'amt', text: RM(e.amount) }))));
}
function drawActivity(mo, expenses, tot) {
  const body = $('tx-body');
  const note = $('activity-note');
  const chips = $('cat-chips');
  if (S('expenses').status !== 'ok') {
    activityState = { mo: null, rows: [] };
    const st = S('expenses').status;
    body.replaceChildren(h('tr', null, h('td', { colspan: '5' }, st === 'error' || st === 'missing' ? h('div', { class: 'xp-fail', text: 'Failed to load' }) : h('span', { class: 'dash-skeleton', text: 'Loading entries' }))));
    return;
  }
  const rows = expenses.filter((e) => e.date && e.date.startsWith(mo.month)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.sheet_row - a.sheet_row));
  activityState = { mo, rows };
  const pick = dash.params().cat;
  const present = CAT_ORDER.concat([...new Set(rows.map((e) => catName(e.category)))].filter((c) => !CAT_ORDER.includes(c))).filter((c) => rows.some((e) => catName(e.category) === c));
  chips.replaceChildren(
    h('button', { type: 'button', class: 'xp-chipbtn', 'aria-pressed': String(!pick), onclick: () => dash.setParams({ cat: null }) }, 'All'),
    ...present.map((c) => h('button', { type: 'button', class: 'xp-chipbtn', 'aria-pressed': String(pick === c), style: { '--cc': catInfo(c).c }, onclick: () => setCat(c) }, h('i', { class: 'xp-dot' }), c)));
  note.replaceChildren(...(tot
    ? [h('span', { mark: ['totals', 'entries', { month: mo.month }], text: String(tot.entries) }), plural(tot.entries, ' entry', ' entries') + ' in ' + mo.label + ', newest first' + (pick ? ' · filtered to ' + pick : '')]
    : ['Entries in ' + mo.label + ', newest first']));
  drawActivityRows();
}

// ── Footer ─────────────────────────────────────────────────────
function drawFoot(budgets, checks) {
  const fb = $('foot-budgets');
  const fc = $('foot-check');
  if (S('budgets').status === 'ok') {
    const parts = ['Budgets come from your budget sheet (Expenses + Liabilities): '];
    budgets.forEach((b, i) => {
      if (i) parts.push(' · ');
      parts.push(h('b', { text: b.category }), ' ← ', b.from_lines ? h('span', { mark: ['budgets', 'from_lines', { category: b.category }], text: b.from_lines }) : 'no line matched');
    });
    parts.push('. Lain-lain has no budget line. Simpanan shows your Net Income minus all spending.');
    fb.replaceChildren(...parts);
  } else fb.replaceChildren();
  const ex = S('expenses');
  if (S('checks').status === 'ok' && ex.status === 'ok' && checks[0]) {
    const meta = ex.meta || [];
    const sheetTotal = meta.find((x) => /total/i.test(x.label) && !/count/i.test(x.label));
    const sheetCount = meta.find((x) => /count/i.test(x.label));
    const c = checks[0];
    const entries = h('b', { mark: ['checks', 'entries', 0], text: String(c.entries) });
    const total = h('b', { mark: ['checks', 'total', 0], text: RM(c.total) });
    if (sheetTotal) {
      const ok = Math.abs(parseFloat(sheetTotal.value) - c.total) < 0.005 && (!sheetCount || parseInt(sheetCount.value, 10) === c.entries);
      fc.replaceChildren(h('span', { class: 'xp-ok' + (ok ? '' : ' is-off') }, icon(ok ? 'check' : 'alert'),
        h('span', null, ok ? ['All ', entries, ' entries read; their total, ', total, ', matches your sheet’s own Total row.'] : ['Read ', entries, ' entries totalling ', total, ', which differs from your sheet’s own Total row. Check for rows outside the log table.'])));
    } else fc.replaceChildren(h('span', null, 'All ', entries, ' entries read, totalling ', total, '.'));
  } else fc.replaceChildren();
}

// ── Draw everything ────────────────────────────────────────────
function render() {
  const ok = (id) => S(id).status === 'ok';
  const months = ok('months') ? S('months').data : [];
  const mo = months.length ? pickMonth(months) : null;
  const rowsOf = (id) => (ok(id) && mo ? S(id).data.filter((r) => r.month === mo.month) : []);
  if (!mo) {
    const st = S('months').status;
    ['hero', 'budget-list', 'burnup-chart', 'donut', 'merchant-list', 'lainlain-list', 'method-list', 'cal', 'month-chart'].forEach((id) => {
      const box = $(id);
      if (notReady(box, ['months'])) return;
      box.replaceChildren(h('p', { class: 'xp-empty', text: 'No entries in your sheet yet.' }));
    });
    const take = $('takeaway');
    if (st === 'ok') take.replaceChildren('No entries in your sheet yet. Log one from your Shortcut to begin.');
    else if (st === 'error' || st === 'missing') take.replaceChildren('Couldn’t read your sheet just now.');
    else if (st === 'connect') take.replaceChildren('Waiting for your Google Drive connection.');
    else if (st === 'declined') take.replaceChildren('Google Drive access was declined, so your sheet can’t be read.');
    if (st === 'ok') $('insights').replaceChildren(h('div', { class: 'xp-ins', style: { '--ic': 'var(--brand-b)' } }, h('span', { class: 'xp-iico' }, icon('spark')), h('div', null, h('span', { class: 'k', text: 'Tip' }), h('p', null, 'Log an expense from your Shortcut and this page fills in.'))));
    else drawInsights([], { month: '' }, null, null, [], [], [], [], []);
    drawActivity({ month: '', label: '' }, [], null);
    drawFoot(ok('budgets') ? S('budgets').data : [], ok('checks') ? S('checks').data : []);
    return;
  }
  const tot = rowsOf('totals')[0] || null;
  const pl = rowsOf('plan')[0] || null;
  const cats = rowsOf('categories');
  const uses = rowsOf('budget_use');
  drawHeader(months, mo, tot, pl);
  if (tot) drawHero(months, mo, tot, pl); else notReady($('hero'), ['totals']);
  drawInsights(months, mo, tot, pl, cats, uses, rowsOf('merchants'), rowsOf('daily'), rowsOf('methods'));
  drawBudgets(mo, cats, uses);
  drawBurnup(months, mo, tot, pl, ok('daily') ? S('daily').data : []);
  drawDonut(mo, tot, cats);
  drawMerchants(mo, rowsOf('merchants'));
  drawLainlain(mo, rowsOf('merchants'), cats);
  drawMethods(mo, rowsOf('methods'));
  drawCalendar(mo, ok('daily') ? S('daily').data : [], ok('expenses') ? S('expenses').data : []);
  drawMonths(months, mo, ok('totals') ? S('totals').data : [], ok('plan') ? S('plan').data : []);
  drawActivity(mo, ok('expenses') ? S('expenses').data : [], tot);
  drawFoot(ok('budgets') ? S('budgets').data : [], ok('checks') ? S('checks').data : []);
  if (firstDraw && tot && ['categories', 'daily', 'merchants', 'methods', 'expenses'].every(ok)) {
    firstDraw = false;
    root.classList.add('xp-in');
    setTimeout(() => root.classList.remove('xp-in'), 2000);
    const named = location.hash && document.getElementById(location.hash.slice(1));
    if (named && root.contains(named)) setTimeout(() => named.scrollIntoView({ block: 'start' }), 60);
  }
}

// ── Mounting: nothing is read from your sheets until the PIN is entered ──
// The dashboard's markup (and every data mark in it) waits in a <template>; the lock
// script calls show() after a correct PIN, and hide() when it locks again.
let started = false;
const appEl = document.getElementById('app');
window.xpDash = {
  show() {
    appEl.hidden = false;
    if (!started) {
      started = true;
      appEl.append(document.getElementById('app-tpl').content.cloneNode(true));
      bindControls();
      dash.onData(render);
    } else {
      render();
    }
  },
  hide() {
    appEl.hidden = true;
  },
};
