dash.calc('months', {
  title: 'Months tracked',
  description: 'Each month from your first entry to this month, and how far into it today is (your device\'s date).',
  inputs: ['expenses'],
  fn: (expenses) => {
    const NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const thisMonth = now.getFullYear() + '-' + pad(now.getMonth() + 1);
    const dates = expenses.map((e) => e.date).filter(Boolean).sort();
    if (!dates.length) return [];
    const first = dates[0];
    const last = dates[dates.length - 1].slice(0, 7) > thisMonth ? dates[dates.length - 1].slice(0, 7) : thisMonth;
    const out = [];
    for (let y = +first.slice(0, 4), m = +first.slice(5, 7); y * 100 + m <= +last.replace('-', ''); m === 12 ? (y++, m = 1) : m++) {
      const month = y + '-' + pad(m);
      const days = new Date(y, m, 0).getDate();
      const current = month === thisMonth;
      const day = current ? now.getDate() : days;
      out.push({
        month, label: NAMES[m - 1] + ' ' + y, days, as_of_day: day,
        pct_month: Math.round((day / days) * 100), days_left: current ? days - day + 1 : 0,
        is_current: current, tracked_from: month === first.slice(0, 7) ? +first.slice(8, 10) : 1,
      });
    }
    return out;
  },
});

dash.calc('budgets', {
  title: 'Budget per category',
  description: 'Your budget sheet lines (Expenses + Liabilities columns), grouped into tracker categories the way you matched them on the page. Lain-lain and Simpanan have no line.',
  inputs: ['budget_plan', 'budget_map'],
  fn: (budget_plan, budget_map) => {
    const CATS = ['Makan & Minum', 'Minyak Motor / Kereta', 'Keperluan/Komitmen', 'Telefon & Internet', 'Gajet/Subscription'];
    const catOf = new Map(budget_map.map((r) => [r.line, r.category]));
    const lines = budget_plan.filter((b) => b.line !== 'Net Income');
    return CATS.map((category) => {
      const mine = lines.filter((b) => catOf.get(b.line) === category);
      const cents = mine.reduce((sum, b) => sum + Math.round(((b.expenses || 0) + (b.liabilities || 0)) * 100), 0);
      return { category, budget: mine.length ? cents / 100 : null, from_lines: mine.map((b) => b.line).join(' + ') };
    });
  },
});

dash.calc('totals', {
  title: 'Month totals',
  description: 'Spent (every category except Simpanan), entries and saved per month, with a month-end projection: everyday spending at the month\'s daily pace, plus entries of RM100 or more counted once.',
  inputs: ['expenses', 'months'],
  fn: (expenses, months) => {
    const ONE_OFF = 100; // RM: one entry this size is a one-off, counted once rather than projected
    const cents = (rows) => rows.reduce((sum, e) => sum + Math.round((e.amount || 0) * 100), 0);
    const first = expenses.map((e) => e.date).filter(Boolean).sort()[0] || '';
    return months.map((mo, i) => {
      const inMonth = expenses.filter((e) => e.date && e.date.startsWith(mo.month));
      const spend = inMonth.filter((e) => e.category !== 'Simpanan');
      const spent = cents(spend);
      const oneOffs = cents(spend.filter((e) => e.amount >= ONE_OFF));
      const projected = mo.is_current ? oneOffs + Math.round(((spent - oneOffs) / mo.as_of_day) * mo.days) : spent;
      // Last month to the same day, only when last month was tracked from its 1st
      const prev = months[i - 1];
      const comparable = prev && (prev.month > first.slice(0, 7) || first.slice(8, 10) === '01');
      const before = comparable ? cents(expenses.filter((e) => e.date && e.date.startsWith(prev.month) && e.category !== 'Simpanan' && (!mo.is_current || +e.date.slice(8, 10) <= mo.as_of_day))) : null;
      return {
        month: mo.month,
        spent: spent / 100,
        entries: inMonth.length,
        saved: cents(inMonth.filter((e) => e.category === 'Simpanan')) / 100,
        projected: projected / 100,
        one_offs: oneOffs / 100,
        last_month_same_point: before == null ? null : before / 100,
        vs_last_month: before == null ? null : (spent - before) / 100,
      };
    });
  },
});

dash.calc('categories', {
  title: 'Spending by category',
  description: 'Spent and entries per category each month, and each category\'s share of the month\'s spending. Simpanan counts as saved, not spent.',
  inputs: ['expenses', 'months'],
  fn: (expenses, months) => {
    const ORDER = ['Makan & Minum', 'Minyak Motor / Kereta', 'Keperluan/Komitmen', 'Telefon & Internet', 'Gajet/Subscription', 'Lain-lain', 'Simpanan'];
    const RENAMED = { 'Gajet': 'Gajet/Subscription', 'Keperluan': 'Keperluan/Komitmen' }; // older entries use the short names
    const name = (c) => RENAMED[c] || c;
    const cats = [...ORDER, ...new Set(expenses.map((e) => name(e.category)).filter((c) => c && !ORDER.includes(c)))];
    const cents = (rows) => rows.reduce((sum, e) => sum + Math.round((e.amount || 0) * 100), 0);
    const out = [];
    for (const mo of months) {
      const inMonth = expenses.filter((e) => e.date && e.date.startsWith(mo.month));
      const total = cents(inMonth.filter((e) => e.category !== 'Simpanan'));
      for (const category of cats) {
        const rows = inMonth.filter((e) => name(e.category) === category);
        const spent = cents(rows);
        out.push({ key: mo.month + '|' + category, month: mo.month, category, spent: spent / 100, entries: rows.length, share: category === 'Simpanan' || !total ? null : Math.round((spent / total) * 1000) / 10 });
      }
    }
    return out;
  },
});

dash.calc('budget_use', {
  title: 'Budget use by category',
  description: 'Each category\'s spending against its budget, with a status: over, used up, nearly used (90%+), ahead of pace (50%+ and 15 points past the share of the month gone) or on track.',
  inputs: ['categories', 'budgets', 'months'],
  fn: (categories, budgets, months) => {
    const budget = Object.fromEntries(budgets.map((b) => [b.category, b.budget]));
    const month = Object.fromEntries(months.map((m) => [m.month, m]));
    return categories.map((c) => {
      const b = budget[c.category] ?? null;
      const mo = month[c.month];
      const used = b ? Math.round((c.spent / b) * 100) : null;
      const status = c.category === 'Simpanan' ? 'Saved'
        : b == null ? 'No budget'
        : c.spent > b ? 'Over budget'
        : !mo.is_current ? 'Within budget'
        : used >= 100 ? 'Used up'
        : used >= 90 ? 'Nearly used'
        : used >= 50 && used > mo.pct_month + 15 ? 'Ahead of pace' : 'On track';
      return { key: c.key, month: c.month, category: c.category, budget: b, pct_used: used, status };
    });
  },
});

dash.calc('plan', {
  title: 'Month vs budget plan',
  description: 'The month\'s spending against the total of your category budgets: what is left, a safe amount per remaining day, and spending in categories with no budget line.',
  inputs: ['totals', 'categories', 'budgets', 'months'],
  fn: (totals, categories, budgets, months) => {
    const plan = budgets.reduce((sum, b) => sum + Math.round((b.budget || 0) * 100), 0);
    const planned = new Set(budgets.filter((b) => b.budget != null).map((b) => b.category));
    return months.map((mo) => {
      const t = totals.find((x) => x.month === mo.month);
      const spent = Math.round(t.spent * 100);
      const projected = Math.round(t.projected * 100);
      const used = plan ? Math.round((spent / plan) * 100) : null;
      const unplanned = categories.filter((c) => c.month === mo.month && c.category !== 'Simpanan' && !planned.has(c.category)).reduce((sum, c) => sum + Math.round(c.spent * 100), 0);
      return {
        month: mo.month,
        plan: plan ? plan / 100 : null,
        left: plan ? (plan - spent) / 100 : null,
        over_plan: plan ? Math.max(0, spent - plan) / 100 : null,
        pct_used: used,
        safe_per_day: mo.is_current && plan > spent ? Math.round((plan - spent) / mo.days_left) / 100 : null,
        projected_vs_plan: plan ? (projected - plan) / 100 : null,
        unplanned: unplanned / 100,
        status: !plan ? 'No plan' : spent > plan ? 'Over plan' : !mo.is_current ? 'Within plan' : used > mo.pct_month + 5 ? 'Ahead of pace' : 'On track',
      };
    });
  },
});

dash.calc('savings', {
  title: 'Left for savings',
  description: 'Simpanan as your Net Income minus the month\'s spending in every category: so far, and at this month\'s projected spending.',
  inputs: ['totals', 'budget_plan'],
  fn: (totals, budget_plan) => {
    const row = budget_plan.find((b) => b.line === 'Net Income' && b.income != null);
    if (!row) return [];
    const income = Math.round(row.income * 100);
    return totals.map((t) => ({
      month: t.month,
      income: income / 100,
      left_over: (income - Math.round(t.spent * 100)) / 100,
      left_at_pace: (income - Math.round(t.projected * 100)) / 100,
      pct_left: income ? Math.round(((income - Math.round(t.spent * 100)) / income) * 100) : null,
    }));
  },
});

dash.calc('daily', {
  title: 'Spending per day',
  description: 'Spent (except Simpanan) on each day since tracking began, with the running total for the month.',
  inputs: ['expenses', 'months'],
  fn: (expenses, months) => {
    const pad = (n) => String(n).padStart(2, '0');
    const out = [];
    for (const mo of months) {
      let running = 0;
      for (let d = mo.tracked_from; d <= mo.as_of_day; d++) {
        const date = mo.month + '-' + pad(d);
        const rows = expenses.filter((e) => e.date && e.date.startsWith(date) && e.category !== 'Simpanan');
        const spent = rows.reduce((sum, e) => sum + Math.round((e.amount || 0) * 100), 0);
        running += spent;
        out.push({ date, month: mo.month, day: d, spent: spent / 100, entries: rows.length, running_total: running / 100 });
      }
    }
    return out;
  },
});

dash.calc('merchants', {
  title: 'Spending by item or merchant',
  description: 'Entries grouped by their Item name (ignoring case; a "Refund …" entry nets against its merchant), per month and category. Visits count entries above RM0.',
  inputs: ['expenses'],
  fn: (expenses) => {
    const groups = new Map();
    for (const e of expenses) {
      if (!e.date || !e.item) continue;
      const name = e.item.replace(/^refund\s+/i, '').trim();
      const category = { 'Gajet': 'Gajet/Subscription', 'Keperluan': 'Keperluan/Komitmen' }[e.category] || e.category; // older entries use the short names
      const key = e.date.slice(0, 7) + '|' + category + '|' + name.toLowerCase().replace(/\s+/g, ' ');
      const g = groups.get(key) || { key, month: e.date.slice(0, 7), category, merchant: name, visits: 0, cents: 0 };
      if (e.amount > 0) { if (!g.visits) g.merchant = name; g.visits++; }
      g.cents += Math.round((e.amount || 0) * 100);
      groups.set(key, g);
    }
    return [...groups.values()].map(({ cents, ...g }) => ({ ...g, spent: cents / 100 }));
  },
});

dash.calc('methods', {
  title: 'Spending by payment method',
  description: 'Spent (except Simpanan) per payment method, read from the Notes column, per month.',
  inputs: ['expenses'],
  fn: (expenses) => {
    const SAME = { 'qr pay': 'QR Pay', 'qr': 'QR Pay', 'credit card': 'Credit Card', 'cc': 'Credit Card', 'debit card': 'Debit Card', 'cash': 'Cash' };
    const groups = new Map();
    const totals = new Map();
    for (const e of expenses) {
      if (!e.date || e.category === 'Simpanan') continue;
      const month = e.date.slice(0, 7);
      const raw = (e.method || '').trim();
      const method = SAME[raw.toLowerCase()] || raw || 'Not noted';
      const g = groups.get(month + '|' + method) || { key: month + '|' + method, month, method, entries: 0, cents: 0 };
      g.entries++;
      g.cents += Math.round((e.amount || 0) * 100);
      groups.set(g.key, g);
      totals.set(month, (totals.get(month) || 0) + Math.round((e.amount || 0) * 100));
    }
    return [...groups.values()].map(({ cents, ...g }) => ({ ...g, spent: cents / 100, share: totals.get(g.month) ? Math.round((cents / totals.get(g.month)) * 1000) / 10 : null }));
  },
});

dash.calc('checks', {
  title: 'All-time totals',
  description: 'Every entry and their total, to compare with the sheet\'s own Total row.',
  inputs: ['expenses'],
  fn: (expenses) => [{ entries: expenses.length, total: expenses.reduce((sum, e) => sum + Math.round((e.amount || 0) * 100), 0) / 100 }],
});
