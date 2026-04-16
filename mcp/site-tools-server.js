#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PROJECT_DIR = process.cwd();

const server = new McpServer({ name: 'site-tools', version: '1.0.0' });

// ── run_tests ─────────────────────────────────────────────────────────────────
server.tool(
  'run_tests',
  'Run the Vitest test suite (npm test) and return pass/fail summary',
  {},
  async () => {
    try {
      const { stdout, stderr } = await execFileAsync('npm', ['test'], {
        cwd: PROJECT_DIR,
        timeout: 60_000,
      });
      return { content: [{ type: 'text', text: `PASS\n\n${(stdout + stderr).trim()}` }] };
    } catch (err) {
      const out = ((err.stdout || '') + (err.stderr || '')).trim();
      return { content: [{ type: 'text', text: `FAIL\n\n${out}` }], isError: true };
    }
  }
);

// ── build_site ────────────────────────────────────────────────────────────────
server.tool(
  'build_site',
  'Run node build.js to produce public/. Optionally pass a webhook_url to inject.',
  { webhook_url: z.string().optional().describe('N8N_WEBHOOK_URL to inject at build time') },
  async ({ webhook_url }) => {
    const env = { ...process.env, ...(webhook_url ? { N8N_WEBHOOK_URL: webhook_url } : {}) };
    try {
      const { stdout, stderr } = await execFileAsync('node', ['build.js'], {
        cwd: PROJECT_DIR,
        env,
        timeout: 30_000,
      });
      return { content: [{ type: 'text', text: `BUILD OK\n\n${(stdout + stderr).trim()}` }] };
    } catch (err) {
      const out = ((err.stdout || '') + (err.stderr || '')).trim();
      return { content: [{ type: 'text', text: `BUILD FAILED\n\n${out}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
