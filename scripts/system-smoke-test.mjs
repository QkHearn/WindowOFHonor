/**
 * 系统冒烟测试 — 对已运行的 Docker 栈做端到端验证
 * 用法: BASE_URL=http://localhost:8080 MCP_URL=http://localhost:3100 node scripts/system-smoke-test.mjs
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const MCP = process.env.MCP_URL ?? 'http://localhost:3100';
const MCP_KEY = process.env.MCP_API_KEY ?? 'change_me_mcp_client_key';
const ADMIN_USER = process.env.SEED_SUPERADMIN_USERNAME ?? 'superadmin';
const ADMIN_PASS = process.env.SEED_SUPERADMIN_PASSWORD ?? 'change_me_on_first_deploy';

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, ok: false, error: msg });
    console.error(`  ✗ ${name}: ${msg}`);
  }
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

console.log(`\n🔍 System smoke test`);
console.log(`   Web/API: ${BASE}`);
console.log(`   MCP:     ${MCP}\n`);

await check('API health', async () => {
  const data = await fetchJson(`${BASE}/api/health`);
  if (data.status !== 'ok') throw new Error('unexpected health response');
});

await check('MCP health', async () => {
  const data = await fetchJson(`${MCP}/health`);
  if (data.status !== 'ok') throw new Error('unexpected mcp health');
});

await check('Web homepage', async () => {
  const res = await fetch(`${BASE}/`);
  if (!res.ok) throw new Error(`status ${res.status}`);
  const html = await res.text();
  if (!html.includes('荣耀之窗')) throw new Error('missing page content');
});

let token;
await check('Login (superadmin)', async () => {
  const data = await fetchJson(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  if (!data.accessToken) throw new Error('no token');
  token = data.accessToken;
});

await check('Broadcast feed', async () => {
  const data = await fetchJson(`${BASE}/api/broadcast/honors`);
  if (!Array.isArray(data)) throw new Error('not an array');
});

await check('Personal leaderboard', async () => {
  const data = await fetchJson(`${BASE}/api/leaderboard/personal`);
  if (!Array.isArray(data)) throw new Error('invalid leaderboard');
});

await check('Team leaderboard', async () => {
  const data = await fetchJson(`${BASE}/api/leaderboard/team`);
  if (!Array.isArray(data)) throw new Error('not an array');
});

await check('User search (auth)', async () => {
  await fetchJson(`${BASE}/api/users/search?q=a`, {
    headers: { Authorization: `Bearer ${token}` },
  });
});

await check('MCP endpoint reachable', async () => {
  const res = await fetch(`${MCP}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${MCP_KEY}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'smoke-test', version: '1.0.0' },
      },
    }),
  });
  if (res.status === 401) throw new Error('MCP auth failed — check MCP_API_KEY');
  if (res.status >= 500) throw new Error(`MCP server error ${res.status}`);
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${failed.length ? '❌' : '✅'} ${results.length - failed.length}/${results.length} passed\n`);
process.exit(failed.length ? 1 : 0);
