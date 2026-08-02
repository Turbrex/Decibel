// Include on login.html / signup.html. If a valid session already exists,
// send the visitor straight to the homepage instead of showing the form.
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.replace('index.html');
    return;
  }
  document.documentElement.classList.add('auth-ready');
})();
