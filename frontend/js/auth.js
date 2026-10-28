// Handles signup, login, forgot-password and reset-password pages (chosen by <body data-page="...">).
(async function () {
  'use strict';
  const { $, $$ } = PX;
  const page = document.body.dataset.page;
  const msg = $('#form-msg');
  const form = $('#auth-form');
  const show = (type, text) => { msg.className = 'msg msg-' + type; msg.textContent = text; msg.hidden = false; };

  function friendly(error) {
    const m = (error && error.message) || '';
    if (/invalid login credentials/i.test(m)) return 'Email or password is incorrect.';
    if (/email not confirmed/i.test(m)) return 'Please confirm your email first. Check your inbox (and spam folder) for the confirmation link.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Please wait a few minutes and try again.';
    if (/same password/i.test(m)) return 'Choose a password different from your old one.';
    if (/password/i.test(m) && /characters|weak|short/i.test(m)) return 'That password is too weak. Use at least 8 characters with letters and numbers.';
    return m || 'Something went wrong. Please try again.';
  }
  function passwordProblem(pw) {
    if (pw.length < 8) return 'Use at least 8 characters.';
    if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Include at least one letter and one number.';
    return '';
  }

  $$('.toggle-pw').forEach((b) => b.addEventListener('click', () => {
    const input = document.getElementById(b.dataset.target);
    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    b.textContent = reveal ? 'Hide' : 'Show';
    b.setAttribute('aria-pressed', String(reveal));
  }));

  let client;
  try { client = await PX.init(); } catch (e) { show('error', e.message); return; }

  const params = new URLSearchParams(location.search);
  if (page === 'login') {
    const { data } = await client.auth.getSession();
    if (data.session) { location.replace(PX.safeNext()); return; }
    if (params.get('reason') === 'expired') show('warn', 'Your session expired. Please log in again.');
    else if (params.get('confirmed')) show('success', 'Email confirmed. You can log in now.');
    else if (params.get('reset')) show('success', 'Password updated. Log in with your new password.');
    else if (params.get('loggedout')) show('info', 'You have been logged out.');
  }

  if (page === 'signup') {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); PX.clearErrors(form); msg.hidden = true;
      const v = PX.readForm(form); const errs = {};
      if (v.full_name.trim().length < 2) errs.full_name = 'Enter your full name.';
      if (!v.email.trim()) errs.email = 'Enter your email address.';
      const pwProblem = passwordProblem(v.password); if (pwProblem) errs.password = pwProblem;
      if (v.password !== v.confirm) errs.confirm = 'The two passwords do not match.';
      if (PX.showErrors(form, errs)) return;
      const btn = $('button[type=submit]', form); PX.busy(btn, true, 'Creating account\u2026');
      const { data, error } = await client.auth.signUp({
        email: v.email.trim(), password: v.password,
        options: { data: { full_name: v.full_name.trim() }, emailRedirectTo: location.origin + '/login.html?confirmed=1' },
      });
      PX.busy(btn, false);
      if (error) return show('error', friendly(error));
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return show('error', 'This email is already registered. Try logging in or resetting your password.');
      }
      if (data.session) { location.href = '/dashboard.html'; return; }
      form.hidden = true;
      show('success', 'Account created! We sent a confirmation link to ' + v.email.trim() + '. Open it, then log in.');
    });
  }

  if (page === 'login') {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); PX.clearErrors(form); msg.hidden = true;
      const v = PX.readForm(form); const errs = {};
      if (!v.email.trim()) errs.email = 'Enter your email address.';
      if (!v.password) errs.password = 'Enter your password.';
      if (PX.showErrors(form, errs)) return;
      const btn = $('button[type=submit]', form); PX.busy(btn, true, 'Logging in\u2026');
      const { error } = await client.auth.signInWithPassword({ email: v.email.trim(), password: v.password });
      PX.busy(btn, false);
      if (error) return show('error', friendly(error));
      location.href = PX.safeNext();
    });
  }

  if (page === 'forgot') {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); PX.clearErrors(form); msg.hidden = true;
      const v = PX.readForm(form);
      if (!v.email.trim()) { PX.showErrors(form, { email: 'Enter your email address.' }); return; }
      const btn = $('button[type=submit]', form); PX.busy(btn, true, 'Sending\u2026');
      const { error } = await client.auth.resetPasswordForEmail(v.email.trim(), { redirectTo: location.origin + '/reset-password.html' });
      PX.busy(btn, false);
      if (error) return show('error', friendly(error));
      // Same message whether or not the account exists (prevents guessing which emails are registered).
      show('success', 'If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder.');
    });
  }

  if (page === 'reset') {
    // Supabase reads the recovery token from the link and creates a temporary session.
    const { data } = await client.auth.getSession();
    if (!data.session) {
      form.hidden = true;
      show('error', 'This reset link is invalid or has expired. Please request a new one.');
      $('#request-new').hidden = false;
      return;
    }
    form.hidden = false;
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); PX.clearErrors(form); msg.hidden = true;
      const v = PX.readForm(form); const errs = {};
      const pwProblem = passwordProblem(v.password); if (pwProblem) errs.password = pwProblem;
      if (v.password !== v.confirm) errs.confirm = 'The two passwords do not match.';
      if (PX.showErrors(form, errs)) return;
      const btn = $('button[type=submit]', form); PX.busy(btn, true, 'Saving\u2026');
      const { error } = await client.auth.updateUser({ password: v.password });
      PX.busy(btn, false);
      if (error) return show('error', friendly(error));
      await client.auth.signOut();
      location.href = '/login.html?reset=1';
    });
  }
})();
