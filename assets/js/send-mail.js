// Shared helper used by the contact form and the art commission form to
// actually send mail (via the send-email Supabase Edge Function, which
// relays through ImprovMX's SMTP) instead of only opening a mailto: draft.
// Falls back to the caller returning ok:false so each form can drop back to
// mailto: if the function isn't deployed yet or the request fails.
async function sendSiteMail({ name, email, subject, message }) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return { ok: false, error: 'Not signed in' };

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ name, email, subject, message }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      return { ok: false, error: body.error || `Request failed (${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
