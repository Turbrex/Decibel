// DECIBEL DISTRIBUTION — shared front-end behaviour

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initTicker();
  initCart();
  initMerchTabs();
  initContactForm();
  initNewsletterForm();
});

/* ---------- mobile nav ---------- */
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

/* ---------- marquee ticker: duplicate content for seamless loop ---------- */
function initTicker() {
  const track = document.querySelector('.ticker-track');
  if (!track) return;
  track.innerHTML += track.innerHTML;
}

/* ---------- toast ---------- */
let toastTimer;
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ---------- cart (client-side only, localStorage) ---------- */
const CART_KEY = 'decibel_cart_count';

function getCartCount() {
  return parseInt(localStorage.getItem(CART_KEY) || '0', 10);
}

function setCartCount(n) {
  localStorage.setItem(CART_KEY, String(n));
  document.querySelectorAll('#cart-count').forEach((el) => (el.textContent = n));
}

function initCart() {
  setCartCount(getCartCount());

  document.querySelectorAll('.add-cart-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      setCartCount(getCartCount() + 1);
      const name = btn.dataset.product || 'Item';
      showToast(`Added "${name}" to cart`);
    });
  });
}

/* ---------- merch category tabs ---------- */
function initMerchTabs() {
  const tabs = document.querySelectorAll('.merch-tab');
  const cards = document.querySelectorAll('[data-category]');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.filter;
      cards.forEach((card) => {
        const show = cat === 'all' || card.dataset.category === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/* ---------- contact form: real send via send-email function, mailto fallback ---------- */
function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const name = form.querySelector('#cf-name')?.value.trim() || '';
    const email = form.querySelector('#cf-email')?.value.trim() || '';
    const subject = form.querySelector('#cf-subject')?.value || 'Website inquiry';
    const message = form.querySelector('#cf-message')?.value || '';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const result = await sendSiteMail({ name, email, subject, message });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';

    if (result.ok) {
      showToast(name ? `Thanks, ${name} — message sent` : 'Message sent');
      form.reset();
      return;
    }

    console.warn('sendSiteMail failed, falling back to mailto:', result.error);
    showToast('Sending failed — opening your email client instead');
    const mailtoSubject = encodeURIComponent(subject);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:info@decibel.band?subject=${mailtoSubject}&body=${body}`;
    form.reset();
  });
}

/* ---------- newsletter (visual only, no backend) ---------- */
function initNewsletterForm() {
  const form = document.querySelector('#newsletter-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('You\'re on the list');
    form.reset();
  });
}
