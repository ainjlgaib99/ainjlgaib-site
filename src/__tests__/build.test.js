import { describe, it, expect } from 'vitest';
import { buildSite } from '../../build.js';

const SAMPLE_HTML = `<!DOCTYPE html><html><head></head><body>
<script>const WEBHOOK = 'N8N_WEBHOOK_PLACEHOLDER';</script>
<footer>ainjlgaib.com</footer>
</body></html>`;

describe('buildSite', () => {
  it('replaces the placeholder with the provided webhook URL', () => {
    const result = buildSite(SAMPLE_HTML, 'https://n8n.example.com/webhook/abc123');
    expect(result).toContain('https://n8n.example.com/webhook/abc123');
    expect(result).not.toContain('N8N_WEBHOOK_PLACEHOLDER');
  });

  it('substitutes an empty string when no webhook URL is provided', () => {
    const result = buildSite(SAMPLE_HTML, '');
    expect(result).toContain("const WEBHOOK = '';");
    expect(result).not.toContain('N8N_WEBHOOK_PLACEHOLDER');
  });

  it('leaves all other HTML content unchanged', () => {
    const result = buildSite(SAMPLE_HTML, 'https://n8n.example.com/webhook/abc123');
    expect(result).toContain('<footer>ainjlgaib.com</footer>');
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('only replaces the first occurrence (String.replace behaviour)', () => {
    const html = 'N8N_WEBHOOK_PLACEHOLDER and N8N_WEBHOOK_PLACEHOLDER';
    const result = buildSite(html, 'https://replaced.url');
    expect(result).toBe('https://replaced.url and N8N_WEBHOOK_PLACEHOLDER');
  });
});
