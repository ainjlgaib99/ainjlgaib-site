import { toggleFaqItem, submitFormData, validateFormInputs } from './form.js';

// ── Scroll reveal ──
document.documentElement.classList.add('js');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── FAQ accordion ──
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    toggleFaqItem(document.querySelectorAll('.faq-item'), btn.parentElement);
  });
});

// ── Contact form ──
const WEBHOOK = 'N8N_WEBHOOK_PLACEHOLDER'; // replaced at build time

document.getElementById('submitBtn').addEventListener('click', async () => {
  const name   = document.getElementById('fname').value.trim();
  const email  = document.getElementById('femail').value.trim();

  if (!validateFormInputs(name, email)) {
    alert('Please enter your name and contact info.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Sending\u2026';

  await submitFormData({
    name,
    email,
    type:   document.getElementById('ftype').value,
    desc:   document.getElementById('fdesc').value.trim(),
    budget: document.getElementById('fbudget').value,
    webhook: WEBHOOK,
  });

  document.getElementById('formFields').classList.add('hide');
  document.getElementById('formSuccess').classList.add('show');
});
