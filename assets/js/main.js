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

/* ---------- contact form (static site — no backend) ---------- */
function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#cf-name')?.value.trim();
    showToast(name ? `Thanks, ${name} — message drafted in your email client` : 'Message drafted in your email client');
    const subject = encodeURIComponent(form.querySelector('#cf-subject')?.value || 'Website inquiry');
    const body = encodeURIComponent(
      `Name: ${form.querySelector('#cf-name')?.value || ''}\nEmail: ${form.querySelector('#cf-email')?.value || ''}\n\n${form.querySelector('#cf-message')?.value || ''}`
    );
    window.location.href = `mailto:info@decibeldistribution.com?subject=${subject}&body=${body}`;
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
