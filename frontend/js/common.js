// Shared helpers for every PortfolioX page. Exposes one global object: PX.
// Safety rule: user text is only ever inserted with textContent / createTextNode (never innerHTML).
(function () {
  'use strict';
  const PX = {};
  let client = null;
  let config = null;
  let lastScore = null;

  PX.$ = (selector, root) => (root || document).querySelector(selector);
  PX.$$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  // h('div', {class:'card'}, 'text', childElement) -> safe DOM builder
  PX.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === false || value === null || value === undefined) continue;
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? '' : value);
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.append(kid);
    }
    return el;
  };
  const h = PX.h;

  PX.safeUrl = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null);
  PX.link = (text, href, cls) => {
    const safe = PX.safeUrl(href);
    return safe ? h('a', { href: safe, target: '_blank', rel: 'noopener noreferrer', class: cls }, text) : null;
  };
  PX.fmtDate = (v) => {
    if (!v) return '';
    const d = new Date(v + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  };
  PX.chips = (list) => h('div', { class: 'chips' }, (list || []).map((t) => h('span', { class: 'chip' }, t)));
  PX.yearLabel = (n) => ({ 1: '1st year', 2: '2nd year', 3: '3rd year', 4: '4th year', 5: '5th year', 6: '6th year' }[n] || '');

  // ---------- Supabase + API ----------
  PX.init = async function () {
    if (client) return client;
    let res;
    try { res = await fetch('/api/config'); } catch (e) { throw new Error('Cannot reach the PortfolioX server. Is it running? (npm start)'); }
    const json = await res.json();
    config = json.data;
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return client;
  };
  PX.client = () => client;
  PX.config = () => config;

  class ApiError extends Error {
    constructor(message, status, fields) { super(message); this.status = status; this.fields = fields; }
  }
  PX.ApiError = ApiError;

  // PX.api('/projects', {method:'POST', body:{...}}) -> returns json.data or throws ApiError
  PX.api = async function (path, opts) {
    opts = opts || {};
    await PX.init();
    const headers = { Accept: 'application/json' };
    if (opts.body) headers['Content-Type'] = 'application/json';
    if (!opts.public) {
      const { data } = await client.auth.getSession();
      if (data.session) headers.Authorization = 'Bearer ' + data.session.access_token;
    }
    let res;
    try {
      res = await fetch('/api' + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    } catch (e) {
      throw new ApiError('Cannot reach the PortfolioX server. Check that it is running and try again.', 0);
    }
    let json = null;
    try { json = await res.json(); } catch (e) { /* not JSON */ }
    if (res.status === 401 && !opts.public) {
      await client.auth.signOut();
      location.href = '/login.html?reason=expired';
      throw new ApiError('Your session has expired.', 401);
    }
    if (!res.ok || !json || json.ok === false) {
      const err = (json && json.error) || {};
      throw new ApiError(err.message || 'Something went wrong. Please try again.', res.status, err.fields);
    }
    return json.data;
  };

  PX.requireAuth = async function () {
    await PX.init();
    const { data } = await client.auth.getSession();
    if (!data.session) {
      location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search));
      return null;
    }
    return data.session;
  };

  PX.safeNext = function () {
    const next = new URLSearchParams(location.search).get('next');
    return next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/dashboard.html';
  };

  // ---------- UI helpers ----------
  PX.toast = function (message, type) {
    let box = PX.$('#toasts');
    if (!box) {
      box = h('div', { id: 'toasts', class: 'toasts', 'aria-live': 'polite', role: 'status' });
      document.body.append(box);
    }
    const t = h('div', { class: 'toast toast-' + (type || 'info') }, message);
    box.append(t);
    setTimeout(() => t.remove(), 5000);
  };

  PX.setStatus = function (el, type, text, retry) {
    el.replaceChildren();
    if (!type) { el.hidden = true; return; }
    el.hidden = false;
    el.className = 'msg msg-' + type;
    if (type === 'info' && /\u2026$/.test(text)) el.append(h('span', { class: 'spinner', 'aria-hidden': 'true' }));
    el.append(text);
    if (retry) el.append(' ', h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: retry }, 'Try again'));
  };

  PX.busy = function (button, on, label) {
    if (!button) return;
    if (on) { button.dataset.label = button.textContent; button.disabled = true; if (label) button.textContent = label; }
    else { button.disabled = false; if (button.dataset.label) button.textContent = button.dataset.label; }
  };

  PX.clearErrors = function (form) {
    PX.$$('.field-error', form).forEach((e) => e.remove());
    PX.$$('.field.invalid', form).forEach((f) => f.classList.remove('invalid'));
  };
  PX.showErrors = function (form, fields) {
    PX.clearErrors(form);
    let first = null;
    for (const [name, message] of Object.entries(fields || {})) {
      const input = form.elements[name];
      const wrap = input && input.closest ? input.closest('.field, .check') : null;
      if (!wrap) continue;
      wrap.classList.add('invalid');
      const id = 'err-' + name + '-' + (form.id || 'f');
      wrap.append(h('p', { class: 'field-error', id, role: 'alert' }, message));
      input.setAttribute('aria-describedby', id);
      input.setAttribute('aria-invalid', 'true');
      if (!first) first = input;
    }
    if (first) first.focus();
    return !!first;
  };

  PX.fillForm = function (form, values) {
    for (const el of Array.from(form.elements)) {
      if (!el.name) continue;
      const v = values ? values[el.name] : undefined;
      if (el.type === 'checkbox') el.checked = !!v;
      else if (Array.isArray(v)) el.value = v.join(', ');
      else el.value = v === null || v === undefined ? '' : v;
    }
  };
  PX.readForm = function (form) {
    const out = {};
    for (const el of Array.from(form.elements)) {
      if (!el.name || el.type === 'submit' || el.type === 'button') continue;
      out[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    }
    return out;
  };

  // Accessible confirmation dialog (replaces window.confirm)
  PX.confirm = function (title, message, okLabel) {
    return new Promise((resolve) => {
      const dlg = h('dialog', { 'aria-labelledby': 'cf-title' },
        h('div', { class: 'dialog-body' },
          h('h2', { id: 'cf-title' }, title), h('p', {}, message),
          h('div', { class: 'dialog-actions' },
            h('button', { class: 'btn btn-secondary', type: 'button', id: 'cf-cancel' }, 'Cancel'),
            h('button', { class: 'btn btn-danger', type: 'button', id: 'cf-ok' }, okLabel || 'Delete'))));
      document.body.append(dlg);
      const done = (v) => { dlg.close(); dlg.remove(); resolve(v); };
      PX.$('#cf-cancel', dlg).addEventListener('click', () => done(false));
      PX.$('#cf-ok', dlg).addEventListener('click', () => done(true));
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); done(false); });
      dlg.showModal();
      PX.$('#cf-cancel', dlg).focus();
    });
  };

  PX.renderMeter = function (ringEl, numEl, score) {
    ringEl.style.setProperty('--pct', String(score));
    ringEl.setAttribute('role', 'img');
    ringEl.setAttribute('aria-label', 'Readiness score ' + score + ' out of 100');
    numEl.textContent = String(score);
  };
  PX.bar = (percent, large) => {
    const fill = h('span');
    fill.style.width = Math.max(0, Math.min(100, percent)) + '%';
    return h('div', { class: 'bar' + (large ? ' bar-lg' : ''), role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(percent) }, fill);
  };

  // ---------- Readiness widget in the sidebar ----------
  PX.setScore = function (score) {
    lastScore = score;
    const box = PX.$('#side-score');
    if (!box) return;
    box.replaceChildren(h('div', { class: 'small' }, 'Readiness score'), h('strong', {}, score + ' / 100'), PX.bar(score));
  };
  // Call after any save: re-reads the score from the server and tells the student what changed.
  PX.refreshScore = async function (announce) {
    const before = lastScore;
    try {
      const r = await PX.api('/readiness');
      PX.setScore(r.score);
      if (announce) {
        const diff = before === null ? 0 : r.score - before;
        PX.toast('Saved. Readiness score: ' + r.score + '/100' + (diff > 0 ? ' (+' + diff + ')' : ''), 'success');
      }
      return r;
    } catch (e) { if (announce) PX.toast('Saved.', 'success'); return null; }
  };

  // ---------- Sidebar / shell for private pages ----------
  PX.shell = async function (active, session) {
    const nav = [
      ['dashboard', 'Dashboard', '/dashboard.html'], ['profile', 'Profile', '/profile.html'],
      ['projects', 'Projects', '/projects.html'], ['achievements', 'Achievements', '/achievements.html'],
      ['readiness', 'Readiness meter', '/readiness.html'], ['resume', 'Resume builder', '/resume.html'],
      ['portfolio', 'Preview portfolio', '/portfolio.html?preview=1'],
    ];
    const side = PX.$('#sidebar');
    const logout = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Log out');
    logout.addEventListener('click', async () => { await client.auth.signOut(); location.href = '/login.html?loggedout=1'; });
    side.replaceChildren(
      h('a', { class: 'brand', href: '/dashboard.html' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'PX'), 'PortfolioX'),
      h('nav', { class: 'side-nav', 'aria-label': 'Main' }, nav.map(([key, label, href]) => h('a', { href, 'aria-current': key === active ? 'page' : false }, label))),
      h('div', { id: 'side-score', class: 'side-score' }, h('span', { class: 'small' }, 'Readiness score\u2026')),
      h('div', { class: 'side-user' }, session && session.user ? session.user.email : ''),
      logout);
    const btn = PX.$('#menu-btn'); const scrim = PX.$('#scrim');
    const toggle = (open) => { side.classList.toggle('open', open); scrim.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => toggle(!side.classList.contains('open')));
    scrim.addEventListener('click', () => toggle(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
    PX.refreshScore(false);
  };

  // Standard page start: init, require login, build sidebar. Returns the session (or null if redirecting).
  PX.startPrivatePage = async function (active) {
    try {
      const session = await PX.requireAuth();
      if (!session) return null;
      await PX.shell(active, session);
      return session;
    } catch (e) {
      const main = PX.$('#main');
      main.replaceChildren(h('div', { class: 'msg msg-error' }, e.message || 'Could not start the page.'));
      return null;
    }
  };

  // ---------- Checklist component (dashboard + readiness page) ----------
  PX.renderChecklist = function (box, data, onChange) {
    const list = h('ul', { class: 'checklist' });
    data.items.forEach((item) => {
      const li = h('li');
      if (item.type === 'auto') {
        li.append(h('span', { class: 'tick' + (item.done ? ' done' : ''), 'aria-hidden': 'true' }, '\u2713'),
          h('span', { class: 'grow' }, item.label, h('span', { class: 'sr-only' }, item.done ? ' (done)' : ' (not done)')));
        if (item.done) li.append(h('span', { class: 'badge badge-pub' }, 'Done automatically'));
        else li.append(h('a', { class: 'btn btn-secondary btn-sm', href: item.link }, 'Do this'));
      } else {
        const id = 'ck-' + item.key;
        const cb = h('input', { type: 'checkbox', id });
        cb.checked = item.done;
        cb.addEventListener('change', async () => {
          cb.disabled = true;
          try {
            const updated = await PX.api('/checklist', { method: 'PUT', body: { task_key: item.key, is_done: cb.checked } });
            PX.renderChecklist(box, updated, onChange);
            if (onChange) onChange(updated);
          } catch (e) { cb.checked = !cb.checked; cb.disabled = false; PX.toast(e.message, 'error'); }
        });
        li.append(cb, h('label', { class: 'grow', for: id }, item.label), h('span', { class: 'badge' }, 'You tick this'));
      }
      list.append(li);
    });
    box.replaceChildren(
      h('p', { class: 'small muted' }, data.done + ' of ' + data.total + ' tasks done (' + data.percent + '%). Finishing the checklist improves your preparation but does not guarantee an internship or placement.'),
      PX.bar(data.percent), list);
  };

  // ---------- Landing page nav toggle ----------
  document.addEventListener('DOMContentLoaded', () => {
    const t = PX.$('#nav-toggle'); const links = PX.$('#nav-links');
    if (t && links) t.addEventListener('click', () => { const open = links.classList.toggle('open'); t.setAttribute('aria-expanded', String(open)); });
  });

  window.PX = PX;
})();
