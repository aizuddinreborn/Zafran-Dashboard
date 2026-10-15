// A small stand-in for the dashboard runtime the page was first written for:
// it holds the datasets fetched from Apps Script, runs the calcs over them and
// redraws whenever data or the page's filters (month, category, day) change.
window.dash = (() => {
  const calcs = {};
  const subs = [];
  let base = {};
  let store = {};
  let params = {};
  const LOADING = { status: 'loading', data: [], meta: [] };

  const run = (fn) => { try { fn(); } catch (e) { console.error(e); } };
  const notify = () => subs.forEach(run);

  function compute() {
    store = Object.assign({}, base);
    let progress = true;
    while (progress) {
      progress = false;
      for (const [id, c] of Object.entries(calcs)) {
        if (store[id]) continue;
        const ins = c.inputs.map((i) => store[i]);
        if (ins.some((x) => !x)) continue;
        const bad = ins.find((x) => x.status !== 'ok');
        if (bad) store[id] = { status: bad.status, data: [], meta: [] };
        else {
          try { store[id] = { status: 'ok', data: c.fn(...ins.map((x) => x.data)), meta: [] }; }
          catch (e) { console.error('calc ' + id, e); store[id] = { status: 'error', data: [], meta: [] }; }
        }
        progress = true;
      }
    }
  }

  return {
    loader() {},
    calc(id, o) { calcs[id] = o; },
    data(id) { return store[id] || LOADING; },
    onData(fn) { subs.push(fn); run(fn); },
    params() { return params; },
    setParams(p) {
      params = Object.assign({}, params, p);
      for (const k of Object.keys(params)) if (params[k] == null) delete params[k];
      notify();
    },
    resetParams() { params = {}; notify(); },
    setLink(name) { try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ } },
    refresh() {},
    colors: [],
    // Called by the lock script with fresh datasets: {id: {status, data, meta}}
    __set(partial) { Object.assign(base, partial); compute(); notify(); },
    // Drops every row from memory (used when the dashboard locks)
    __clear() { base = {}; store = {}; },
  };
})();
