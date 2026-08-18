document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#art-request-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');

    const name = form.querySelector('#art-name').value.trim();
    const email = form.querySelector('#art-email').value.trim();
    const project = form.querySelector('#art-project').value.trim();
    const pkg = form.querySelector('#art-package').value;
    const brief = form.querySelector('#art-brief').value.trim();

    const subject = `Cover Art Commission — ${project}`;
    const message = `Project / Artist: ${project}\nPackage: ${pkg}\n\nBrief:\n${brief}`;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const result = await sendSiteMail({ name, email, subject, message });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Brief';

    if (result.ok) {
      showToast('Brief sent to Quan');
      form.reset();
      return;
    }

    console.warn('sendSiteMail failed, falling back to mailto:', result.error);
    showToast('Sending failed — opening your email client instead');
    const mailtoSubject = encodeURIComponent(subject);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:brady@decibel.band?subject=${mailtoSubject}&body=${body}`;
    form.reset();
  });
});
