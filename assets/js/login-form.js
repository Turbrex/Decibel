document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#login-form');
  const errorBox = document.querySelector('.auth-error');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';

    const email = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      errorBox.textContent = error.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : error.message;
      errorBox.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log In';
      return;
    }

    window.location.replace('index.html');
  });
});
