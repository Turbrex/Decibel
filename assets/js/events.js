// Events list + admin-only create/delete + Discord webhook notification.
// Admin gating here is UX only -- the real enforcement is the RLS policies
// in supabase/events-schema.sql, so a non-admin submitting anyway is
// rejected by Supabase, not just hidden by this script.

document.addEventListener('DOMContentLoaded', () => {
  if (document.documentElement.classList.contains('auth-ready')) {
    initEvents();
  } else {
    document.addEventListener('decibel:auth-ready', initEvents, { once: true });
  }
});

async function initEvents() {
  if (window.isAdmin) {
    document.querySelector('#admin-event-panel')?.classList.add('show');
    document.querySelector('#admin-webhook-panel')?.classList.add('show');
    const badge = document.querySelector('#admin-page-badge');
    if (badge) badge.style.display = 'inline-block';
    loadWebhookSetting();
  }

  await loadEvents();

  document.querySelector('#event-form')?.addEventListener('submit', handleCreateEvent);
  document.querySelector('#webhook-form')?.addEventListener('submit', handleSaveWebhook);
}

async function loadEvents() {
  const list = document.querySelector('#events-list');
  const empty = document.querySelector('#events-empty');
  if (!list || !empty) return;

  const { data, error } = await supabaseClient
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) {
    list.innerHTML = '';
    empty.textContent = `Couldn't load events: ${error.message}`;
    empty.style.display = 'block';
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = '';
    empty.textContent = 'No events scheduled yet — check back soon.';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = data.map(renderEventCard).join('');

  if (window.isAdmin) {
    list.querySelectorAll('[data-delete-event]').forEach((btn) => {
      btn.addEventListener('click', () => handleDeleteEvent(btn.dataset.deleteEvent));
    });
  }
}

function renderEventCard(evt) {
  const date = new Date(evt.event_date);
  const dateStr = date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return `
    <div class="card event-card">
      <div class="event-date-badge">${dateStr} &middot; ${timeStr}</div>
      <div class="event-title">${escapeHtml(evt.title)}</div>
      ${evt.location ? `<div class="event-meta">${escapeHtml(evt.location)}</div>` : ''}
      ${evt.description ? `<p class="event-meta">${escapeHtml(evt.description)}</p>` : ''}
      <div class="event-actions">
        ${evt.link ? `<a href="${escapeAttr(evt.link)}" target="_blank" rel="noopener" class="release-link">Details &rarr;</a>` : ''}
        ${window.isAdmin ? `<button class="add-cart-btn" data-delete-event="${evt.id}">Delete</button>` : ''}
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

async function handleCreateEvent(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  const title = form.querySelector('#event-title').value.trim();
  const date = form.querySelector('#event-date').value;
  const location = form.querySelector('#event-location').value.trim();
  const link = form.querySelector('#event-link').value.trim();
  const description = form.querySelector('#event-description').value.trim();

  const { data, error } = await supabaseClient
    .from('events')
    .insert({
      title,
      event_date: new Date(date).toISOString(),
      location: location || null,
      link: link || null,
      description: description || null,
      created_by: window.currentUser?.id,
    })
    .select()
    .single();

  submitBtn.disabled = false;
  submitBtn.textContent = 'Create Event';

  if (error) {
    showToast(`Couldn't create event: ${error.message}`);
    return;
  }

  form.reset();
  showToast('Event created');
  await loadEvents();
  notifyDiscord(data);
}

async function handleDeleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  const { error } = await supabaseClient.from('events').delete().eq('id', id);
  if (error) {
    showToast(`Couldn't delete event: ${error.message}`);
    return;
  }
  showToast('Event deleted');
  loadEvents();
}

async function loadWebhookSetting() {
  const input = document.querySelector('#webhook-url');
  if (!input) return;
  const { data } = await supabaseClient.from('settings').select('value').eq('key', 'discord_webhook_url').maybeSingle();
  if (data?.value) input.value = data.value;
}

async function handleSaveWebhook(e) {
  e.preventDefault();
  const form = e.target;
  const url = form.querySelector('#webhook-url').value.trim();

  const { error } = await supabaseClient.from('settings').upsert({ key: 'discord_webhook_url', value: url });

  if (error) {
    showToast(`Couldn't save webhook: ${error.message}`);
    return;
  }
  showToast('Discord webhook saved');
}

async function notifyDiscord(evt) {
  const { data } = await supabaseClient.from('settings').select('value').eq('key', 'discord_webhook_url').maybeSingle();
  const webhookUrl = data?.value;
  if (!webhookUrl) return;

  const date = new Date(evt.event_date);
  const dateStr = date.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const fields = [{ name: 'When', value: dateStr, inline: false }];
  if (evt.location) fields.push({ name: 'Where', value: evt.location, inline: false });

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: evt.title,
          description: evt.description || undefined,
          color: 14817836,
          fields,
          url: evt.link || undefined,
        }],
      }),
    });
  } catch (err) {
    console.error('Discord webhook failed:', err);
  }
}
