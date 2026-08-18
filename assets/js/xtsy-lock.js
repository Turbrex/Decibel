// xtsy* page lock. The password is never stored anywhere -- not even as a
// hash. Instead it's fed through PBKDF2 to derive an AES-GCM key, and the
// actual gated content below is stored ONLY as ciphertext in this file.
// Entering the wrong password just fails to decrypt (AES-GCM's built-in
// auth tag rejects it) -- there's nothing readable to extract without the
// real password, which is a meaningfully higher bar than hiding a
// hash-gated DOM node with CSS.

const XTSY_SALT = 'x5YkdQOEiKsuhIwLIZvqxQ==';
const XTSY_IV = 'a4rABCslF/qkNqFN';
const XTSY_ITERATIONS = 250000;
const XTSY_CIPHERTEXT = 'YCp+dBRsybL3jp+PyjOswmaegrT9D1rVnW3RMlVb+L+bzzBTxfbhnW7H+8bSvLdwvJz1AA2PHo5NSWK1coBmkJ7sl79WYTzA1rYZfky3Hrf8iF2Kt0hDKFVz7BKWc3mJEVO6RuZ9gcSuCjbXN8AZobD0cbap2wBlowfGzUSfYNmPhyT0qDLyJNqw4eZ4tPRiAPnd4AnwnUihPNd3P/H7pXgoeQBA0T+u/W5pESR/aXHTNZjdfCSzGGqQEuXan2MDGkzi/fd7H4luaVwxeMOmg2rY9hxcJEaKJWEMw235k0EPDIdokiju2H3Vs/1kIrkUzgYKkih7GRtQ2ehFEYPsQGt9kDi9N2U2sPy7IEfxshzuqJrhomYS1wIweJ70JufyeovCanK8ue+TA0OdkPWmyQRK8P3IFOCDOl9Xo8xqPeY7+XZWnMAndLy/8R6PP8LDHQblvxmVdKhAx4ExJfAhkYGYRBUN1llrDpD/SCIcOdv0vNbtcd739YuDxF4ya3Rfg8JV4Dzh6SRp/CQktJG29GZJY015NU8+v6o5ZXb1cVbZY9SEqNkwch2x32HVbfkPrvMVUBX3hfTWA+EXoCm7gGv+5+zrbGigjamZ5E7LIBFOTCZbHLsiKq9qp1RVmqnD7fWVygXKPLVw6+MHeA/2MICd9zS/drbjodUskY2D9Zvjuq4CohBeWgHmuOKqYlyxlRd+hAZmWIgeRcBnaXEt5+qHvppIb4S7sImkpagzeeBFFw5w8LmKQHtD7R51AVIzGgCN0QqALtAKw4kFw/6xLe+wEGfPrmNDLsdiTQkupdTs0jOQai14xAAXWu2IKrJpUPoBJyH9eYQ2DLvst44W5ibeckOwG4RG7b5wsQbQ7XMotcEqQYjTAw==';

function fromB64(str) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function tryUnlock(password) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(XTSY_SALT), iterations: XTSY_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(XTSY_IV) },
    aesKey,
    fromB64(XTSY_CIPHERTEXT)
  );
  return new TextDecoder().decode(plainBuf);
}

/* ---------- scattered asterisk background, different size/angle/opacity ---------- */
function spawnAsterisks() {
  const field = document.querySelector('.xtsy-asterisk-field');
  if (!field) return;
  const count = 55;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'bg-asterisk';
    el.textContent = '*';
    el.style.top = `${Math.random() * 100}%`;
    el.style.left = `${Math.random() * 100}%`;
    el.style.fontSize = `${1 + Math.random() * 5.5}rem`;
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    el.style.opacity = String(0.06 + Math.random() * 0.22);
    el.style.color = Math.random() > 0.75 ? '#fff' : 'var(--xtsy-pink)';
    field.appendChild(el);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  spawnAsterisks();

  const form = document.querySelector('#xtsy-lock-form');
  const lockScreen = document.querySelector('#xtsy-lock-screen');
  const reveal = document.querySelector('#xtsy-reveal');
  const errorEl = document.querySelector('#xtsy-lock-error');
  const input = document.querySelector('#xtsy-password');
  const submitBtn = form?.querySelector('button[type="submit"]');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Unlocking...';

    try {
      const html = await tryUnlock(input.value);
      reveal.innerHTML = html;
      lockScreen.classList.add('unlocked-out');
      reveal.classList.add('show');
      setTimeout(() => lockScreen.remove(), 500);
    } catch {
      errorEl.textContent = 'Wrong password.';
      errorEl.classList.add('show');
      lockScreen.classList.remove('shake');
      void lockScreen.offsetWidth;
      lockScreen.classList.add('shake');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Unlock';
      input.value = '';
      input.focus();
    }
  });
});
