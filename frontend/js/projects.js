(async function () {
  'use strict';
  const { $, h } = PX;
  if (!(await PX.startPrivatePage('projects'))) return;
  const status = $('#status'); const list = $('#project-list'); const dlg = $('#project-dialog'); const form = $('#project-form');
  const search = $('#search'); const catFilter = $('#cat-filter');
  let projects = [];

  const cats = PX.config().projectCategories;
  cats.forEach((c) => { form.elements.category.append(h('option', { value: c }, c)); catFilter.append(h('option', { value: c }, c)); });

  function card(p) {
    return h('article', { class: 'card item-card' },
      h('div', { class: 'item-head' }, h('h3', {}, p.title),
        h('div', {}, p.is_featured ? h('span', { class: 'badge badge-feat' }, 'Featured') : null, ' ',
          h('span', { class: 'badge' + (p.is_public ? ' badge-pub' : '') }, p.is_public ? 'Public' : 'Private'))),
      h('div', { class: 'item-meta' }, p.category + (p.completed_on ? ' \u00b7 Completed ' + PX.fmtDate(p.completed_on) : '')),
      h('p', {}, p.description),
      p.purpose ? h('p', { class: 'small' }, h('strong', {}, 'Purpose: '), p.purpose) : null,
      p.role ? h('p', { class: 'small' }, h('strong', {}, 'My role: '), p.role) : null,
      PX.chips(p.technologies),
      h('div', { class: 'small' }, PX.link('GitHub repository', p.github_url), p.github_url && p.live_url ? ' \u00b7 ' : null, PX.link('Live demo', p.live_url)),
      h('div', { class: 'item-actions' },
        h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: () => openForm(p) }, 'Edit'),
        h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: () => remove(p) }, 'Delete')));
  }

  function render() {
    const q = search.value.trim().toLowerCase(); const cat = catFilter.value;
    const shown = projects.filter((p) => (!cat || p.category === cat) &&
      (!q || [p.title, p.description, p.role, (p.technologies || []).join(' ')].join(' ').toLowerCase().includes(q)));
    $('#count').textContent = projects.length ? 'Showing ' + shown.length + ' of ' + projects.length : '';
    list.replaceChildren();
    if (!projects.length) {
      list.append(h('div', { class: 'card empty' }, h('h3', {}, 'No projects yet'),
        h('p', {}, 'Add an academic or personal project you have genuinely worked on. Even a small one helps your portfolio.'),
        h('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm(null) }, 'Add your first project')));
    } else if (!shown.length) {
      list.append(h('div', { class: 'card empty' }, h('p', {}, 'No projects match your search or filter.')));
    } else shown.forEach((p) => list.append(card(p)));
  }

  async function load() {
    PX.setStatus(status, 'info', 'Loading your projects\u2026');
    try { projects = await PX.api('/projects'); PX.setStatus(status, null); render(); }
    catch (e) { PX.setStatus(status, 'error', e.message, load); }
  }

  function openForm(p) {
    PX.clearErrors(form); form.reset();
    PX.fillForm(form, p || { is_public: true });
    form.dataset.id = p ? p.id : '';
    $('#dialog-title').textContent = p ? 'Edit project' : 'Add project';
    dlg.showModal(); form.elements.title.focus();
  }

  async function remove(p) {
    if (!(await PX.confirm('Delete this project?', '"' + p.title + '" will be permanently removed from your portfolio and resume.'))) return;
    try { await PX.api('/projects/' + p.id, { method: 'DELETE' }); projects = projects.filter((x) => x.id !== p.id); render(); PX.refreshScore(true); }
    catch (e) { PX.toast(e.message, 'error'); }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); PX.clearErrors(form);
    const id = form.dataset.id; const btn = $('button[type=submit]', form); PX.busy(btn, true, 'Saving\u2026');
    try {
      await PX.api(id ? '/projects/' + id : '/projects', { method: id ? 'PUT' : 'POST', body: PX.readForm(form) });
      dlg.close(); await load(); PX.refreshScore(true);
    } catch (err) {
      if (err.fields) PX.showErrors(form, err.fields);
      PX.toast(err.message, 'error');
    } finally { PX.busy(btn, false); }
  });

  $('#add-btn').addEventListener('click', () => openForm(null));
  $('#cancel-btn').addEventListener('click', () => dlg.close());
  search.addEventListener('input', render); catFilter.addEventListener('change', render);
  load();
})();
