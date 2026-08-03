// Include on every protected page. Redirects to login.html unless a valid
// Supabase session exists. Page content stays hidden (see .auth-gate CSS)
// until this resolves, so unauthenticated visitors never see a flash of it.
// Exposed for other page scripts (e.g. events.js) so they don't need their
// own getSession() round trip. isAdmin reflects the "role":"admin" claim in
// app_metadata, which only SQL/service-role can set -- never the user
// themselves -- so it's safe to also trust server-side in RLS policies.
window.currentUser = null;
window.isAdmin = false;

(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.replace('login.html');
    return;
  }
  window.currentUser = session.user;
  window.isAdmin = session.user.app_metadata?.role === 'admin';
  document.documentElement.classList.add('auth-ready');
  document.querySelectorAll('[data-user-email]').forEach((el) => {
    el.textContent = session.user.email;
  });
  document.dispatchEvent(new CustomEvent('decibel:auth-ready', { detail: { user: session.user, isAdmin: window.isAdmin } }));
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
