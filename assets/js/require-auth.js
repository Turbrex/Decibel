// Include on every protected page. Redirects to login.html unless a valid
// Supabase session exists. Page content stays hidden (see .auth-gate CSS)
// until this resolves, so unauthenticated visitors never see a flash of it.
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.replace('login.html');
    return;
  }
  document.documentElement.classList.add('auth-ready');
  document.querySelectorAll('[data-user-email]').forEach((el) => {
    el.textContent = session.user.email;
  });
})();

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    window.location.replace('login.html');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-logout]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabaseClient.auth.signOut();
      window.location.replace('login.html');
    });
  });
});
