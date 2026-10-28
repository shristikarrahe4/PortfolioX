(async function () {
  'use strict';
  const { $, h } = PX;
  if (!(await PX.startPrivatePage('readiness'))) return;
  const status = $('#status');

  async function load() {
    PX.setStatus(status, 'info', 'Calculating your readiness score\u2026');
    try {
      const [r, checklist] = await Promise.all([PX.api('/readiness'), PX.api('/checklist')]);
      PX.setStatus(status, null);
      PX.renderMeter($('#ring'), $('#ring-num'), r.score); PX.setScore(r.score);
      $('#level').textContent = r.level;
      $('#score-summary').textContent = r.score + ' of 100 points earned from the information saved in your account.';

      $('#criteria').replaceChildren(...r.criteria.map((c) => h('div', { class: 'crit' },
        h('div', { class: 'crit-head' }, h('span', {}, h('a', { href: c.link }, c.label)), h('span', {}, c.earned + ' / ' + c.max)),
        PX.bar(Math.round((c.earned / c.max) * 100)),
        h('ul', {}, c.items.map((i) => h('li', { class: i.done ? 'done' : 'todo' },
          h('span', { 'aria-hidden': 'true' }, i.done ? '\u2713' : '\u25cb'),
          h('span', {}, i.label + ' (' + i.points + ' pts)', h('span', { class: 'sr-only' }, i.done ? ' - done' : ' - not done'))))))));

      const recs = $('#recs');
      recs.replaceChildren(r.recommendations.length
        ? h('div', {}, r.recommendations.map((x) => h('div', { class: 'rec' },
            h('div', {}, h('strong', {}, x.message), h('div', { class: 'item-meta' }, x.criterion + ' \u00b7 +' + x.points + ' points')),
            h('a', { class: 'btn btn-primary btn-sm', href: x.link }, 'Fix this'))))
        : h('div', { class: 'msg msg-success' }, 'Great work! Every readiness item is complete. Keep your information up to date.'));

      PX.renderChecklist($('#checklist'), checklist);
    } catch (e) { PX.setStatus(status, 'error', e.message, load); }
  }
  load();
})();
