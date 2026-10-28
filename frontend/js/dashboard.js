(async function () {
  'use strict';
  const { $, h } = PX;
  if (!(await PX.startPrivatePage('dashboard'))) return;
  const status = $('#status');

  async function load() {
    PX.setStatus(status, 'info', 'Loading your dashboard\u2026');
    try {
      const d = await PX.api('/dashboard');
      PX.setStatus(status, null);
      $('#welcome').textContent = 'Welcome' + (d.name ? ', ' + d.name.split(' ')[0] : '') + '!';
      $('#st-score').textContent = d.readiness.score + ' / 100';
      $('#st-profile').textContent = d.completion + '%';
      $('#st-projects').textContent = d.counts.projects;
      $('#st-ach').textContent = d.counts.achievements;
      PX.renderMeter($('#ring'), $('#ring-num'), d.readiness.score);
      PX.setScore(d.readiness.score);
      $('#level').textContent = d.readiness.level;

      const next = $('#next-action');
      next.replaceChildren(d.next_action
        ? h('div', { class: 'next-box' }, h('strong', {}, 'Next step: '), d.next_action.message, ' ',
            h('a', { href: d.next_action.link }, 'Go there \u2192'), h('div', { class: 'small muted' }, 'Worth up to ' + d.next_action.points + ' points'))
        : h('div', { class: 'next-box' }, h('strong', {}, 'Your portfolio is complete! '), 'Review it and share your link.'));

      const recent = $('#recent');
      if (!d.recent_projects.length) {
        recent.replaceChildren(h('div', { class: 'empty' }, h('p', {}, 'No projects yet.'), h('a', { class: 'btn btn-primary btn-sm', href: '/projects.html' }, 'Add your first project')));
      } else {
        recent.replaceChildren(...d.recent_projects.map((p) => h('div', { class: 'rec' },
          h('div', {}, h('strong', {}, p.title), h('div', { class: 'item-meta' }, p.category + (p.completed_on ? ' \u00b7 ' + PX.fmtDate(p.completed_on) : '')), PX.chips((p.technologies || []).slice(0, 4))),
          h('a', { class: 'btn btn-secondary btn-sm', href: '/projects.html' }, 'Manage'))));
      }
      PX.renderChecklist($('#checklist'), d.checklist);
    } catch (e) { PX.setStatus(status, 'error', e.message, load); }
  }
  load();
})();
