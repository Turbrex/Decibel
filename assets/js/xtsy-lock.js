// xtsy* page lock. The password is never stored anywhere -- not even as a
// hash. Instead it's fed through PBKDF2 to derive an AES-GCM key, and the
// actual gated content below is stored ONLY as ciphertext in this file.
// Entering the wrong password just fails to decrypt (AES-GCM's built-in
// auth tag rejects it) -- there's nothing readable to extract without the
// real password, which is a meaningfully higher bar than hiding a
// hash-gated DOM node with CSS.

const XTSY_SALT = '89k8fY2/Y9bH8FKq123S6A==';
const XTSY_IV = '8mUvNKxdX2CpYl9R';
const XTSY_ITERATIONS = 250000;
const XTSY_CIPHERTEXT = 'yJGnikBCZnxZv5IRfyvxxhjEnU9sJ/TTW8XJWuQTfipKeFZjz3GsmoAS6OaGmfg0cDKeavpYixCWj+gPQJEFlndUSnmwr80TH61rn6U5hhQmY0/5bRfVsZ6EB51/m5AXXG2/5q6zvRzRNg5Np6HaLZ6M83MTHz0C21vISMfPK7b3YfBsnNtSo9PPt34lMlIuEJwzmsYMU4/l4KyNVzjULMGHujzZqyT/Svj+nh5vzXSacwwnw7zQ47EYV1rUvM6XTUZEa9M95QmejYs8R8hlk126XLUIEQ7DOkgWk9ZRyMKMSLxEc0kHEXrvMKOl4Y3AErTA40n4ywwqXoa64LscGpaHlMXRoIdPBMpqWf9cznIysvXFfZIqYWldqK/0iiy5ghrJusPEPGnglJJfgz8ScA5NJn8REmm80F8Rg4KHSlVpZkh8G6FyAo+Rs6HoyuVG8Xazh+mFYXAqy0YvsijrtO6yZar9lFzFouzOos4uvSKRsSgezW1ohRbS8FmeYERSqxSyiRpNJ8CdpS2qCou4MhLFss7B0DsfTubyt9ZMrtES62Hccp+/jIystC9KoTXYAX3M614Y0WqEZ9G6Cv4b4vtpwdVw07w9PK2HP3fy0dMUmwaPrHhUlhOoWGBsXwwBmWRMWZyedMW6COp6SBoLtBL4N5l7wNYypqSbKr3WdzDM1tKmklJsnTL0OdIQYF2kf6mDCxKJjbt0ua4YQ5NV+amFpzCFjWtLxVZoYZSwpIor/Mat47VLKdosFZz013Uwslme43vwe80NGXTNft/SU5/wvKhwGu/rHNcUzJi4UwDlFb3OcfpQJm2IhfnoVYaOPs2R4J4lXJVKebystkMWSd9TY/cDImA83PXgsDWBf19w/xRdCpPwdUGsJMynMO7EtFF3WygPdUl3Y+gYp2XYCExe';

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
