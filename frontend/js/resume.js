
(async function () {
  'use strict';

  const { $, h } = PX;

  if (!(await PX.startPrivatePage('resume'))) return;

  const status = $('#status');
  const form = $('#resume-form');
  const sheet = $('#resume-sheet');
  let data = null;

  // Safely handle arrays of elements and ignore null values.
  function el(tag, attrs, ...children) {
    const safeChildren = children
      .flat(Infinity)
      .filter(child => child !== null && child !== undefined && child !== false);

    return h(tag, attrs || {}, ...safeChildren);
  }

  const section = (title, ...children) =>
    el('section', {}, el('h2', {}, title), ...children);

  function textLink(url) {
    if (!url || !PX.safeUrl(url)) return null;
    return url.replace(/^https?:\/\/(www\.)?/i, '');
  }

  function renderSheet() {
    if (!data || !data.profile) return;

    const p = data.profile;
    const r = PX.readForm(form);

    const contact = [
      p.contact_email || data.account_email,
      r.phone,
      r.location,
      textLink(p.github_url),
      textLink(p.linkedin_url),
      textLink(p.website_url)
    ].filter(Boolean);

    const education = [
      r.education_summary,
      [p.course, p.college].filter(Boolean).join(', '),
      p.year_of_study ? PX.yearLabel(p.year_of_study) + ' student' : ''
    ].filter(Boolean);

    const projects = (data.projects || []).slice(0, 5);
    const achievements = (data.achievements || []).slice(0, 6);
    const skills = [
      ...(p.technical_skills || []),
      ...(p.soft_skills || [])
    ];

    const content = [
      el('h1', {}, p.full_name || 'Your Name'),

      p.headline
        ? el('p', { class: 'rs-head' }, p.headline)
        : null,

      contact.length
        ? el('p', { class: 'rs-contact' }, contact.join(' | '))
        : null,

      r.objective
        ? section(
            'Career objective',
            el('p', { class: 'rs-sub' }, r.objective)
          )
        : null,

      education.length
        ? section(
            'Education',
            ...education.map(line =>
              el('p', { class: 'rs-sub' }, line)
            )
          )
        : null,

      skills.length
        ? section(
            'Skills',
            (p.technical_skills || []).length
              ? el(
                  'p',
                  { class: 'rs-sub' },
                  el('strong', {}, 'Technical: '),
                  p.technical_skills.join(', ')
                )
              : null,
            (p.soft_skills || []).length
              ? el(
                  'p',
                  { class: 'rs-sub' },
                  el('strong', {}, 'Soft skills: '),
                  p.soft_skills.join(', ')
                )
              : null
          )
        : null,

      projects.length
        ? section(
            'Projects',
            ...projects.map(project =>
              el(
                'div',
                {},
                el(
                  'div',
                  { class: 'rs-row' },
                  el('span', {}, project.title || 'Untitled project'),
                  el(
                    'span',
                    {},
                    project.completed_on
                      ? PX.fmtDate(project.completed_on)
                      : ''
                  )
                ),
                project.description
                  ? el(
                      'p',
                      { class: 'rs-sub' },
                      project.description
                    )
                  : null,
                project.role
                  ? el('p', { class: 'rs-sub' }, 'Role: ' + project.role)
                  : null,
                (project.technologies || []).length
                  ? el(
                      'p',
                      { class: 'rs-sub' },
                      'Technologies: ' + project.technologies.join(', ')
                    )
                  : null,
                textLink(project.github_url)
                  ? el(
                      'p',
                      { class: 'rs-sub' },
                      'Code: ' + textLink(project.github_url)
                    )
                  : null
              )
            )
          )
        : null,

      achievements.length
        ? section(
            'Achievements and certifications',
            el(
              'ul',
              {},
              ...achievements.map(achievement => {
                const details = [
                  achievement.organization,
                  achievement.earned_on
                    ? PX.fmtDate(achievement.earned_on)
                    : ''
                ].filter(Boolean);

                return el(
                  'li',
                  {},
                  (achievement.title || 'Achievement') +
                    (details.length ? ' – ' + details.join(', ') : '')
                );
              })
            )
          )
        : null,

      r.availability
        ? section(
            'Availability',
            el('p', { class: 'rs-sub' }, r.availability)
          )
        : null
    ];

    sheet.replaceChildren(...content.filter(Boolean));
  }

  async function load() {
    PX.setStatus(status, 'info', 'Loading your resume…');

    try {
      data = await PX.api('/resume');

      PX.setStatus(status, null);
      PX.fillForm(form, data.resume || {});
      renderSheet();
    } catch (error) {
      PX.setStatus(status, 'error', error.message, load);
    }
  }

  form.addEventListener('input', renderSheet);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    PX.clearErrors(form);

    const button = $('button[type=submit]', form);
    PX.busy(button, true, 'Saving…');

    try {
      data.resume = await PX.api('/resume', {
        method: 'PUT',
        body: PX.readForm(form)
      });

      renderSheet();
      PX.refreshScore(true);
      PX.toast('Resume details saved successfully.', 'success');
    } catch (error) {
      if (error.fields) PX.showErrors(form, error.fields);
      PX.toast(error.message, 'error');
    } finally {
      PX.busy(button, false);
    }
  });

  $('#print-btn').addEventListener('click', () => {
    window.print();
  });

  await load();
})();
