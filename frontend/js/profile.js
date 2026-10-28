(async function () {
  'use strict';
  const { $, h } = PX;
  if (!(await PX.startPrivatePage('profile'))) return;
  const form = $('#profile-form'); const share = $('#share-form'); const status = $('#status');
  let profile = null;

  function publicLink() { return location.origin + '/u/' + (profile.username || ''); }
  function renderShare() {
    PX.fillForm(share, profile);
    const box = $('#share-info'); box.replaceChildren();
    if (profile.username) {
      box.append(h('div', { class: 'share-box' }, h('span', {}, publicLink()),
        h('button', { class: 'btn btn-secondary btn-sm', type: 'button', id: 'copy-link' }, 'Copy link')));
      $('#copy-link').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(publicLink()); PX.toast('Link copied.', 'success'); }
        catch (e) { PX.toast('Could not copy automatically. Select the link and copy it manually.', 'error'); }
      });
    }
    $('#share-state').textContent = profile.is_public ? 'Your portfolio is PUBLIC: anyone with the link can see it.' : 'Your portfolio is PRIVATE: only you can see it.';
    $('#share-state').className = 'msg ' + (profile.is_public ? 'msg-success' : 'msg-info');
  }
  function renderProfile() {
    PX.fillForm(form, profile);
    if (!profile.contact_email) form.elements.contact_email.placeholder = profile.account_email || '';
    $('#completion-text').textContent = profile.completion + '% complete';
    $('#completion-bar').replaceChildren(PX.bar(profile.completion, true));
  }

  async function load() {
    PX.setStatus(status, 'info', 'Loading your profile\u2026');
    try { profile = await PX.api('/profile'); PX.setStatus(status, null); renderProfile(); renderShare(); }
    catch (e) { PX.setStatus(status, 'error', e.message, load); }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); PX.clearErrors(form);
    const btn = $('button[type=submit]', form); PX.busy(btn, true, 'Saving\u2026');
    try {
      profile = await PX.api('/profile', { method: 'PUT', body: PX.readForm(form) });
      renderProfile(); renderShare(); PX.refreshScore(true);
    } catch (err) {
      if (err.fields) PX.showErrors(form, err.fields);
      PX.toast(err.message, 'error');
    } finally { PX.busy(btn, false); }
  });

  share.addEventListener('submit', async (e) => {
    e.preventDefault(); PX.clearErrors(share);
    const btn = $('button[type=submit]', share); PX.busy(btn, true, 'Saving\u2026');
    try {
      const saved = await PX.api('/portfolio/settings', { method: 'PUT', body: PX.readForm(share) });
      profile = { ...profile, ...saved }; renderShare(); PX.toast('Sharing settings saved.', 'success');
    } catch (err) {
      if (err.fields) PX.showErrors(share, err.fields);
      PX.toast(err.message, 'error');
    } finally { PX.busy(btn, false); }
  });
  load();
})();
