(async function () {
  'use strict';
  const { $, h } = PX;
  if (!(await PX.startPrivatePage('achievements'))) return;
  const status = $('#status'); const list = $('#ach-list'); const dlg = $('#ach-dialog'); const form = $('#ach-form');
  let items = [];
  PX.config().achievementCategories.forEach((c) => form.elements.category.append(h('option', { value: c }, c)));

  function card(a) {
    return h('article', { class: 'card item-card' },
      h('div', { class: 'item-head' }, h('h3', {}, a.title), h('span', { class: 'badge' + (a.is_public ? ' badge-pub' : '') }, a.is_public ? 'Public' : 'Private')),
      h('div', { class: 'item-meta' }, a.organization + ' \u00b7 ' + a.category + ' \u00b7 ' + PX.fmtDate(a.earned_on)),
      a.description ? h('p', {}, a.description) : null,
      a.credential_url ? h('div', { class: 'small' }, PX.link('Credential link', a.credential_url), h('span', { class: 'muted' }, ' (link provided by you; not verified by PortfolioX)')) : null,
      h('div', { class: 'item-actions' },
        h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: () => openForm(a) }, 'Edit'),
        h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: () => remove(a) }, 'Delete')));
  }
  function render() {
    list.replaceChildren();
    if (!items.length) {
      list.append(h('div', { class: 'card empty' }, h('h3', {}, 'No achievements yet'),
        h('p', {}, 'Add certificates, workshops, competitions or academic milestones you have genuinely earned.'),
        h('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm(null) }, 'Add your first achievement')));
    } else items.forEach((a) => list.append(card(a)));
  }
  async function load() {
    PX.setStatus(status, 'info', 'Loading your achievements\u2026');
    try { items = await PX.api('/achievements'); PX.setStatus(status, null); render(); }
    catch (e) { PX.setStatus(status, 'error', e.message, load); }
  }
  function openForm(a) {
    PX.clearErrors(form); form.reset(); PX.fillForm(form, a || { is_public: true });
    form.dataset.id = a ? a.id : ''; $('#dialog-title').textContent = a ? 'Edit achievement' : 'Add achievement';
    dlg.showModal(); form.elements.title.focus();
  }
  async function remove(a) {
    if (!(await PX.confirm('Delete this achievement?', '"' + a.title + '" will be permanently removed.'))) return;
    try { await PX.api('/achievements/' + a.id, { method: 'DELETE' }); items = items.filter((x) => x.id !== a.id); render(); PX.refreshScore(true); }
    catch (e) { PX.toast(e.message, 'error'); }
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); PX.clearErrors(form);
    const id = form.dataset.id; const btn = $('button[type=submit]', form); PX.busy(btn, true, 'Saving\u2026');
    try {
      await PX.api(id ? '/achievements/' + id : '/achievements', { method: id ? 'PUT' : 'POST', body: PX.readForm(form) });
      dlg.close(); await load(); PX.refreshScore(true);
    } catch (err) {
      if (err.fields) PX.showErrors(form, err.fields);
      PX.toast(err.message, 'error');
    } finally { PX.busy(btn, false); }
  });
  $('#add-btn').addEventListener('click', () => openForm(null));
  $('#cancel-btn').addEventListener('click', () => dlg.close());
  load();
})();
