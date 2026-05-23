/**
 * Contact form — FormSubmit (free email to your inbox, no API key).
 * First submission: check sreekarbejjanki@gmail.com and click the activation link once.
 */
(function () {
  const FORM_ENDPOINT = 'https://formsubmit.co/ajax/sreekarbejjanki@gmail.com';

  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-form-status');
  const submitBtn = document.getElementById('contact-form-submit');

  if (!form || !statusEl) return;

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'contact-form__status contact-form__status--' + type;
    statusEl.hidden = !message;
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
    const label = submitBtn.querySelector('.contact-form__submit-label');
    const busy = submitBtn.querySelector('.contact-form__submit-busy');
    if (label) label.hidden = loading;
    if (busy) busy.hidden = !loading;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const honey = form.querySelector('[name="_honey"]');
    if (honey && honey.value) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setStatus('', '');
    setLoading(true);

    const data = new FormData(form);
    const subjectLine = data.get('subject') || 'Portfolio contact';

    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone') || '—',
      company: data.get('company') || '—',
      subject: subjectLine,
      inquiry_type: data.get('inquiry_type'),
      message: data.get('message'),
      _subject: 'Portfolio: ' + subjectLine,
      _template: 'table',
      _captcha: 'false',
    };

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        form.reset();
        setStatus('Thanks! Your message was sent — I will get back to you soon.', 'success');
      } else {
        setStatus('Something went wrong. Please try again or use the email link on the left.', 'error');
      }
    } catch {
      setStatus('Network error. Please check your connection or email me directly.', 'error');
    } finally {
      setLoading(false);
    }
  });
})();
