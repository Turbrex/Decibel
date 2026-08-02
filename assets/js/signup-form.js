document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#signup-form');
  const errorBox = document.querySelector('.auth-error');
  const successBox = document.querySelector('.auth-success');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.remove('show');
    successBox.classList.remove('show');

    const email = form.querySelector('#signup-email').value.trim();
    const password = form.querySelector('#signup-password').value;
    const confirm = form.querySelector('#signup-confirm').value;

    if (password !== confirm) {
      errorBox.textContent = 'Passwords do not match.';
      errorBox.classList.add('show');
      return;
    }
    if (password.length < 8) {
      errorBox.textContent = 'Password must be at least 8 characters.';
      errorBox.classList.add('show');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    const { data, error } = await supabaseClient.auth.signUp({ email, password });

    if (error) {
      if (/already registered/i.test(error.message)) {
        errorBox.textContent = 'You already have an account. Redirecting to login...';
        errorBox.classList.add('show');
        setTimeout(() => window.location.replace('login.html'), 1800);
        return;
      }
      errorBox.textContent = error.message;
      errorBox.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
      return;
    }

    // Existing, already-confirmed accounts come back with no error but an
    // empty identities array (Supabase avoids leaking which emails exist).
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      errorBox.textContent = 'You already have an account. Redirecting to login...';
      errorBox.classList.add('show');
      setTimeout(() => window.location.replace('login.html'), 1800);
      return;
    }

    if (data.session) {
      window.location.replace('index.html');
      return;
    }

    successBox.textContent = 'Account created. Check your email to confirm before logging in.';
    successBox.classList.add('show');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
    form.reset();
  });
});
