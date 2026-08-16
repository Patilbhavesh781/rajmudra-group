import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import bcrypt from 'bcryptjs';

const originalCwd = process.cwd();
const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'rajmudra-api-tests-'));
process.chdir(testDirectory);
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-never-used-in-production';
process.env.INITIAL_ADMIN_PHONE = '7057606126';

const [{ createApiApp }, { memoryStore }] = await Promise.all([
  import('../server/app.js'),
  import('../server/db.js'),
]);

let server: Server;
let baseUrl = '';

before(async () => {
  const app = createApiApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not start.');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
  memoryStore.users = [
    {
      _id: 'admin-test-id', name: 'Sangharsh Patil', phone: '7057606126', role: 'admin',
      passwordHash: await bcrypt.hash('AdminPass123!', 4), isActive: true, activeSessionId: null,
      canUpdateReceiptStatus: true, canManageExpenses: true, createdAt: new Date().toISOString(),
    },
    {
      _id: 'member-test-id', name: 'Test Member', phone: '9999999999', role: 'user',
      passwordHash: await bcrypt.hash('MemberPass123!', 4), isActive: true, activeSessionId: null,
      canUpdateReceiptStatus: false, canManageExpenses: false, createdAt: new Date().toISOString(),
    },
  ];
  memoryStore.pavtis = [];
  memoryStore.expenses = [];
  memoryStore.auditLogs = [];
  memoryStore.counters = { pavtiSeq: 100 };
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  process.chdir(originalCwd);
  try {
    fs.rmSync(testDirectory, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch (error: any) {
    if (!['EBUSY', 'EPERM'].includes(error?.code)) throw error;
  }
});

async function request(pathname: string, options: RequestInit = {}) {
  return fetch(`${baseUrl}${pathname}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
}

async function login(phone: string, password: string) {
  const response = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
  const body = await response.json();
  return { response, body };
}

test('health endpoint responds without authentication', async () => {
  const response = await request('/api/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'ok');
});

test('protected admin endpoint rejects missing authentication', async () => {
  assert.equal((await request('/api/auth/users')).status, 401);
});

test('login rejects an incorrect password and accepts valid credentials', async () => {
  assert.equal((await login('7057606126', 'wrong-password')).response.status, 401);
  const valid = await login('7057606126', 'AdminPass123!');
  assert.equal(valid.response.status, 200);
  assert.equal(valid.body.user.role, 'admin');
  assert.ok(valid.body.token);
});

test('ordinary member cannot access admin member management', async () => {
  const { body } = await login('9999999999', 'MemberPass123!');
  const response = await request('/api/auth/users', { headers: { authorization: `Bearer ${body.token}` } });
  assert.equal(response.status, 403);
});

test('expense and payment-status permissions are enforced by the API', async () => {
  const { body } = await login('9999999999', 'MemberPass123!');
  const headers = { authorization: `Bearer ${body.token}` };
  assert.equal((await request('/api/expenses/create', { method: 'POST', headers, body: JSON.stringify({ title: 'Blocked', amount: 10 }) })).status, 403);
  assert.equal((await request('/api/pavti/update-payment-status', { method: 'POST', headers, body: JSON.stringify({ receiptNo: 'RGM-TEST', paymentStatus: 'paid' }) })).status, 403);

  memoryStore.users[1].canManageExpenses = true;
  memoryStore.users[1].canUpdateReceiptStatus = true;
  assert.equal((await request('/api/expenses/create', { method: 'POST', headers, body: JSON.stringify({}) })).status, 400);
  assert.equal((await request('/api/pavti/update-payment-status', { method: 'POST', headers, body: JSON.stringify({ receiptNo: 'RGM-TEST', paymentStatus: 'paid' }) })).status, 404);
});

test('reset endpoint rejects an incorrect confirmation without deleting data', async () => {
  const { body } = await login('7057606126', 'AdminPass123!');
  const response = await request('/api/auth/reset-mandal-data', { method: 'POST', headers: { authorization: `Bearer ${body.token}` }, body: JSON.stringify({ password: 'AdminPass123!', confirmation: 'WRONG' }) });
  assert.equal(response.status, 400);
  assert.equal(memoryStore.users.length, 2);
});
