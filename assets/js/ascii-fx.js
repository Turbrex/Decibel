// Shared ASCII decoration: a drifting-character canvas background and a
// scramble-to-reveal text effect, both built from only * . - / so they read
// as one consistent visual language across the site.

const ASCII_CHARS = ['*', '.', '-', '/'];
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- canvas rain: columns of drifting characters ---------- */
function initAsciiRain(canvas) {
  const ctx = canvas.getContext('2d');
  const fontSize = 16;
  let columns = 0;
  let drops = [];
  let colors = [];

  const palette = ['rgba(226,26,44,0.75)', 'rgba(201,162,39,0.7)', 'rgba(236,230,218,0.4)'];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    columns = Math.ceil(canvas.width / fontSize);
    drops = new Array(columns).fill(0).map(() => Math.random() * -50);
    colors = new Array(columns).fill(0).map(() => palette[Math.floor(Math.random() * palette.length)]);
  }

  resize();
  window.addEventListener('resize', resize);

  if (REDUCE_MOTION) {
    // Draw one static frame instead of animating.
    ctx.font = `${fontSize}px monospace`;
    for (let i = 0; i < columns; i++) {
      if (Math.random() > 0.6) continue;
      ctx.fillStyle = colors[i];
      const char = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
      ctx.fillText(char, i * fontSize, Math.random() * canvas.height);
    }
    return;
  }

  ctx.font = `${fontSize}px monospace`;

  function frame() {
    ctx.fillStyle = 'rgba(10, 9, 8, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < columns; i++) {
      const char = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
      ctx.fillStyle = colors[i];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
        colors[i] = palette[Math.floor(Math.random() * palette.length)];
      }
      drops[i] += 0.35 + Math.random() * 0.4;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------- scramble-to-reveal text ----------
   Walks to the actual text nodes rather than clobbering el.textContent, so
   nested markup (e.g. <br>, <span class="accent">) survives untouched. */
function scrambleText(el) {
  const textNodes = [];
  (function collect(node) {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
        textNodes.push(child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        collect(child);
      }
    });
  })(el);
  if (textNodes.length === 0) return;

  const originals = textNodes.map((n) => n.textContent);
  const totalFrames = 24;
  let frame = 0;

  function tick() {
    textNodes.forEach((node, idx) => {
      const finalText = originals[idx];
      let out = '';
      for (let i = 0; i < finalText.length; i++) {
        const revealAt = (i / finalText.length) * totalFrames;
        if (frame >= revealAt + 6) {
          out += finalText[i];
        } else if (finalText[i] === ' ' || finalText[i] === '\n') {
          out += finalText[i];
        } else {
          out += ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
        }
      }
      node.textContent = out;
    });
    frame++;
    if (frame <= totalFrames + 6) {
      requestAnimationFrame(tick);
    } else {
      textNodes.forEach((node, idx) => { node.textContent = originals[idx]; });
    }
  }
  tick();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.ascii-rain').forEach((canvas) => initAsciiRain(canvas));

  if (!REDUCE_MOTION) {
    document.querySelectorAll('[data-scramble]').forEach((el) => scrambleText(el));
  }
});
