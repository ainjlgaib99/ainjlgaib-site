// ── Pure logic (fully testable, no DOM dependency) ──

export function validateFormInputs(name, email) {
  return name.length > 0 && email.length > 0;
}

export function buildPayload(name, email, type, desc, budget) {
  return {
    name,
    email,
    type,
    desc,
    budget,
    source: 'ainjlgaib.com',
    timestamp: new Date().toISOString(),
  };
}

export function isLiveWebhook(url) {
  return Boolean(url && !url.includes('PLACEHOLDER'));
}

// ── FAQ toggle (accepts NodeList/Array + element for easy unit testing) ──

export function toggleFaqItem(allItems, clickedItem) {
  const isOpen = clickedItem.classList.contains('open');
  allItems.forEach(i => i.classList.remove('open'));
  if (!isOpen) clickedItem.classList.add('open');
}

// ── Form submission (fetchFn injectable so tests never hit the network) ──

export async function submitFormData({
  name,
  email,
  type,
  desc,
  budget,
  webhook,
  fetchFn = globalThis.fetch,
}) {
  if (!validateFormInputs(name, email)) {
    return { success: false, reason: 'validation' };
  }

  const payload = buildPayload(name, email, type, desc, budget);

  try {
    if (isLiveWebhook(webhook)) {
      await fetchFn(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
  } catch (e) {
    // silent fail — still show success to the user
  }

  return { success: true, payload };
}
