document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#art-request-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('#art-name').value.trim();
    const email = form.querySelector('#art-email').value.trim();
    const project = form.querySelector('#art-project').value.trim();
    const pkg = form.querySelector('#art-package').value;
    const brief = form.querySelector('#art-brief').value.trim();

    const subject = encodeURIComponent(`Cover Art Commission — ${project}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nProject / Artist: ${project}\nPackage: ${pkg}\n\nBrief:\n${brief}`
    );

    window.location.href = `mailto:art@decibeldistribution.com?subject=${subject}&body=${body}`;

    if (typeof showToast === 'function') {
      showToast('Brief drafted in your email client');
    }
    form.reset();
  });
});
