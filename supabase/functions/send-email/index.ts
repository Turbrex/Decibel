// Supabase Edge Function: relays website form submissions through ImprovMX's
// outbound SMTP so mail is actually sent (not just drafted client-side via
// mailto:). Deployed with Supabase's default JWT verification, so only a
// signed-in site visitor can trigger a send -- browsers can't speak SMTP
// directly, which is why this exists as a server-side bridge at all.
//
// Deploy: supabase functions deploy send-email
// Secrets (set these via `supabase secrets set`, never hardcode them here):
//   SMTP_HOST  e.g. smtp.improvmx.com
//   SMTP_PORT  e.g. 587
//   SMTP_USER  the ImprovMX alias you're sending as, e.g. info@decibel.band
//   SMTP_PASS  the SMTP password generated in the ImprovMX dashboard
//   MAIL_FROM  the "From" address shown to recipients, usually same as SMTP_USER
//   MAIL_TO    where form submissions should land, e.g. your personal inbox

import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  let payload: { name?: string; email?: string; subject?: string; message?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const { name, email, subject, message } = payload;
  if (!name || !email || !subject || !message) {
    return json({ ok: false, error: 'name, email, subject, and message are all required' }, 400);
  }
  // Basic shape check -- real validation (deliverability, disposable domains,
  // etc.) isn't worth the complexity here.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Invalid email address' }, 400);
  }

  const SMTP_HOST = Deno.env.get('SMTP_HOST');
  const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') ?? '587');
  const SMTP_USER = Deno.env.get('SMTP_USER');
  const SMTP_PASS = Deno.env.get('SMTP_PASS');
  const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? SMTP_USER;
  const MAIL_TO = Deno.env.get('MAIL_TO');

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
    return json({ ok: false, error: 'Email sending is not configured yet (missing SMTP secrets)' }, 500);
  }

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: SMTP_PORT === 465,
      auth: { username: SMTP_USER, password: SMTP_PASS },
    },
  });

  try {
    await client.send({
      from: MAIL_FROM!,
      to: MAIL_TO,
      replyTo: email,
      subject: `[decibel.band] ${subject}`,
      content: `From: ${name} <${email}>\n\n${message}`,
    });
  } catch (err) {
    console.error('SMTP send failed:', err);
    return json({ ok: false, error: 'Failed to send email' }, 502);
  } finally {
    await client.close();
  }

  return json({ ok: true });
});
