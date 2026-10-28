// Public portfolio (/u/<username>) and the owner's preview (/portfolio.html?preview=1).
(async function () {
  'use strict';
  const { $, h } = PX;
  const root = $('#pf-root');
  const preview = new URLSearchParams(location.search).get('preview') === '1';

  function unavailable(text) {
    document.title = 'Portfolio unavailable \u2014 PortfolioX';
    root.replaceChildren(h('div', { class: 'auth-page' }, h('div', { class: 'auth-card' },
      h('a', { class: 'brand', href: '/' }, h('span', { class: 'brand-mark' }, 'PX'), 'PortfolioX'),
      h('h1', {}, 'Portfolio unavailable'), h('p', { class: 'muted' }, text),
      h('a', { class: 'btn btn-primary', href: '/' }, 'Go to PortfolioX'))));
  }

  function render(d, owner) {
    document.title = (d.full_name || 'Portfolio') + ' \u2014 PortfolioX';
    const initials = (d.full_name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const links = [PX.link('GitHub', d.github_url), PX.link('LinkedIn', d.linkedin_url), PX.link('Website', d.website_url),
      d.contact_email ? h('a', { href: 'mailto:' + d.contact_email }, d.contact_email) : null];
    const edu = [d.course, d.college, d.year_of_study ? PX.yearLabel(d.year_of_study) : ''].filter(Boolean).join(' \u00b7 ');

    const skills = (d.technical_skills.length || d.soft_skills.length) ? h('section', { class: 'card' }, h('h2', {}, 'Skills'),
      d.technical_skills.length ? h('div', {}, h('div', { class: 'label' }, 'Technical'), PX.chips(d.technical_skills)) : null,
      d.soft_skills.length ? h('div', {}, h('div', { class: 'label' }, 'Soft skills'), PX.chips(d.soft_skills)) : null,
      d.interests.length ? h('div', {}, h('div', { class: 'label' }, 'Interests'), PX.chips(d.interests)) : null) : null;

    const projects = d.projects.length ? h('section', {}, h('h2', {}, 'Projects'), h('div', { class: 'grid-auto' }, d.projects.map((p) =>
      h('article', { class: 'card item-card' },
        h('div', { class: 'item-head' }, h('h3', {}, p.title), p.is_featured ? h('span', { class: 'badge badge-feat' }, 'Featured') : null),
        h('div', { class: 'item-meta' }, p.category + (p.completed_on ? ' \u00b7 ' + PX.fmtDate(p.completed_on) : '')),
        h('p', {}, p.description), p.purpose ? h('p', { class: 'small' }, p.purpose) : null,
        p.role ? h('p', { class: 'small' }, h('strong', {}, 'Role: '), p.role) : null, PX.chips(p.technologies),
        h('div', { class: 'small' }, PX.link('Code', p.github_url), p.github_url && p.live_url ? ' \u00b7 ' : null, PX.link('Live demo', p.live_url)))))) : null;

    const ach = d.achievements.length ? h('section', { class: 'card' }, h('h2', {}, 'Achievements and certifications'),
      d.achievements.map((a) => h('div', { class: 'rec' }, h('div', {}, h('strong', {}, a.title),
        h('div', { class: 'item-meta' }, a.organization + ' \u00b7 ' + a.category + ' \u00b7 ' + PX.fmtDate(a.earned_on)),
        a.description ? h('p', { class: 'small' }, a.description) : null),
        PX.link('Credential', a.credential_url, 'small')))) : null;

    const banner = owner ? h('div', { class: 'pf-banner' }, owner.is_public
      ? 'Preview mode. Your portfolio is public at ' + location.origin + '/u/' + owner.username + ' \u00b7 '
      : 'Preview mode. Your portfolio is private right now \u00b7 ',
      h('a', { href: '/profile.html' }, 'Change sharing settings'), ' \u00b7 ', h('a', { href: '/dashboard.html' }, 'Back to dashboard')) : null;

    root.replaceChildren(banner,
      h('header', { class: 'pf-top' }, h('div', { class: 'pf-wrap' }, h('div', { class: 'pf-hero' },
        h('div', { class: 'avatar', 'aria-hidden': 'true' }, initials),
        h('div', {}, h('h1', {}, d.full_name || 'Student'), d.headline ? h('p', {}, d.headline) : null, edu ? h('p', { class: 'small' }, edu) : null,
          h('div', { class: 'pf-links' }, links))))),
      h('main', { class: 'pf-body' },
        d.intro ? h('section', { class: 'card' }, h('h2', {}, 'About me'), h('p', {}, d.intro)) : null,
        skills, projects, ach,
        h('div', { class: 'no-print', id: 'pf-actions' })),
      h('footer', { class: 'footer' }, 'Built with ', h('a', { href: '/' }, 'PortfolioX'), ' \u00b7 Portfolio content is provided by the student and is not verified by PortfolioX.'));

    if (!owner) {
      const copy = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Copy portfolio link');
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(location.href); PX.toast('Link copied.', 'success'); }
        catch (e) { PX.toast('Could not copy automatically. Copy the address from your browser.', 'error'); }
      });
      $('#pf-actions').append(copy);
    }
  }

  try {
    await PX.init();
    if (preview) {
      if (!(await PX.requireAuth())) return;
      const [d, owner] = await Promise.all([PX.api('/portfolio-preview'), PX.api('/profile')]);
      if (!d) return unavailable('Your profile could not be loaded.');
      render(d, owner);
    } else {
      const username = decodeURIComponent(location.pathname.split('/')[2] || '');
      if (!username) return unavailable('This portfolio link is incomplete.');
      render(await PX.api('/portfolio/' + encodeURIComponent(username), { public: true }), null);
    }
  } catch (e) {
    unavailable(e.status === 404 ? e.message : 'The portfolio could not be loaded right now. Please try again later.');
  }
})();
