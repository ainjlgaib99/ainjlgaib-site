import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateFormInputs,
  buildPayload,
  isLiveWebhook,
  toggleFaqItem,
  submitFormData,
} from '../form.js';

// ── validateFormInputs ────────────────────────────────────────────────────────

describe('validateFormInputs', () => {
  it('returns true when both name and email are provided', () => {
    expect(validateFormInputs('Alice', 'alice@example.com')).toBe(true);
  });

  it('returns false when name is empty', () => {
    expect(validateFormInputs('', 'alice@example.com')).toBe(false);
  });

  it('returns false when email is empty', () => {
    expect(validateFormInputs('Alice', '')).toBe(false);
  });

  it('returns false when both are empty', () => {
    expect(validateFormInputs('', '')).toBe(false);
  });
});

// ── buildPayload ──────────────────────────────────────────────────────────────

describe('buildPayload', () => {
  it('includes all provided fields', () => {
    const p = buildPayload('Alice', 'alice@example.com', 'CRM', 'Automate follow-ups', '$300–$500');
    expect(p).toMatchObject({
      name:   'Alice',
      email:  'alice@example.com',
      type:   'CRM',
      desc:   'Automate follow-ups',
      budget: '$300–$500',
    });
  });

  it('always sets source to ainjlgaib.com', () => {
    const p = buildPayload('x', 'x@x.com', '', '', '');
    expect(p.source).toBe('ainjlgaib.com');
  });

  it('includes a valid ISO 8601 timestamp', () => {
    const p = buildPayload('x', 'x@x.com', '', '', '');
    expect(new Date(p.timestamp).getTime()).toBeGreaterThan(0);
    expect(p.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ── isLiveWebhook ─────────────────────────────────────────────────────────────

describe('isLiveWebhook', () => {
  it('returns false for the build-time placeholder', () => {
    expect(isLiveWebhook('N8N_WEBHOOK_PLACEHOLDER')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isLiveWebhook('')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isLiveWebhook(undefined)).toBe(false);
  });

  it('returns true for a real webhook URL', () => {
    expect(isLiveWebhook('https://n8n.example.com/webhook/abc123')).toBe(true);
  });

  it('returns false if PLACEHOLDER appears anywhere in the URL', () => {
    expect(isLiveWebhook('https://example.com/N8N_WEBHOOK_PLACEHOLDER/path')).toBe(false);
  });
});

// ── toggleFaqItem ─────────────────────────────────────────────────────────────

describe('toggleFaqItem', () => {
  let items;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="faq-item"><button class="faq-q"></button></div>
      <div class="faq-item"><button class="faq-q"></button></div>
      <div class="faq-item"><button class="faq-q"></button></div>
    `;
    items = document.querySelectorAll('.faq-item');
  });

  it('opens a closed item', () => {
    toggleFaqItem(items, items[0]);
    expect(items[0].classList.contains('open')).toBe(true);
  });

  it('closes an already-open item when clicked again (accordion toggle)', () => {
    items[0].classList.add('open');
    toggleFaqItem(items, items[0]);
    expect(items[0].classList.contains('open')).toBe(false);
  });

  it('closes all other items when a new one is opened', () => {
    items[0].classList.add('open');
    items[1].classList.add('open');
    toggleFaqItem(items, items[2]);
    expect(items[0].classList.contains('open')).toBe(false);
    expect(items[1].classList.contains('open')).toBe(false);
    expect(items[2].classList.contains('open')).toBe(true);
  });

  it('only one item is ever open at a time', () => {
    toggleFaqItem(items, items[0]);
    toggleFaqItem(items, items[1]);
    const openCount = Array.from(items).filter(i => i.classList.contains('open')).length;
    expect(openCount).toBe(1);
    expect(items[1].classList.contains('open')).toBe(true);
  });
});

// ── submitFormData ────────────────────────────────────────────────────────────

describe('submitFormData', () => {
  it('returns a validation failure when name is empty', async () => {
    const result = await submitFormData({
      name: '', email: 'a@b.com', type: '', desc: '', budget: '', webhook: '',
    });
    expect(result).toEqual({ success: false, reason: 'validation' });
  });

  it('returns a validation failure when email is empty', async () => {
    const result = await submitFormData({
      name: 'Alice', email: '', type: '', desc: '', budget: '', webhook: '',
    });
    expect(result).toEqual({ success: false, reason: 'validation' });
  });

  it('does not call fetch when the webhook is still the build-time placeholder', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    await submitFormData({
      name: 'Alice', email: 'alice@example.com', type: 'CRM', desc: 'desc', budget: '$300',
      webhook: 'N8N_WEBHOOK_PLACEHOLDER',
      fetchFn: mockFetch,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls fetch with the correct URL and JSON body when the webhook is live', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    await submitFormData({
      name: 'Alice', email: 'alice@example.com', type: 'CRM', desc: 'Help me', budget: '$300',
      webhook: 'https://n8n.example.com/webhook/abc',
      fetchFn: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://n8n.example.com/webhook/abc');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      name:   'Alice',
      email:  'alice@example.com',
      type:   'CRM',
      source: 'ainjlgaib.com',
    });
  });

  it('returns success even when fetch throws (silent fail contract)', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await submitFormData({
      name: 'Alice', email: 'alice@example.com', type: '', desc: '', budget: '',
      webhook: 'https://n8n.example.com/webhook/abc',
      fetchFn: mockFetch,
    });
    expect(result.success).toBe(true);
  });

  it('returns the built payload in the success result', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    const result = await submitFormData({
      name: 'Alice', email: 'alice@example.com', type: 'CRM', desc: 'Desc', budget: '$300',
      webhook: 'N8N_WEBHOOK_PLACEHOLDER',
      fetchFn: mockFetch,
    });
    expect(result.payload).toMatchObject({
      name:   'Alice',
      email:  'alice@example.com',
      source: 'ainjlgaib.com',
    });
  });
});
