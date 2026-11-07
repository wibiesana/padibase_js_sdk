import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import PadiBase, { ClientResponseError, BaseAuthStore, LocalAuthStore } from '../dist/index.js';

describe('PadiBase SDK Core Tests', () => {
  let padi;

  beforeEach(() => {
    padi = new PadiBase('http://127.0.0.1:8085');
  });

  test('Initialization and defaults', () => {
    assert.equal(padi.baseUrl, 'http://127.0.0.1:8085');
    assert.ok(padi.authStore instanceof BaseAuthStore);
    assert.ok(padi.files);
    assert.ok(padi.realtime);
    assert.ok(typeof padi.table === 'function');
  });

  test('URL builder with queries', () => {
    const url1 = padi.buildUrl('/api/posts', { page: 1, perPage: 20 });
    assert.equal(url1, 'http://127.0.0.1:8085/api/posts?page=1&perPage=20');

    const url2 = padi.buildUrl('/api/posts', { with: ['author', 'category'] });
    assert.equal(url2, 'http://127.0.0.1:8085/api/posts?with=author%2Ccategory');
  });

  test('AuthStore state and token decoding', () => {
    const store = new BaseAuthStore();
    assert.equal(store.isValid, false);

    // Mock future JWT payload
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ id: 'user_1', exp: futureExp })).toString('base64url');
    const dummyJwt = `${header}.${payload}.signature`;

    let notifiedCount = 0;
    store.onChange((token, record) => {
      notifiedCount++;
      if (notifiedCount === 1) {
        assert.equal(token, dummyJwt);
        assert.equal(record.id, 'user_1');
      } else if (notifiedCount === 2) {
        assert.equal(token, '');
        assert.equal(record, null);
      }
    });

    store.save(dummyJwt, { id: 'user_1', email: 'test@example.com' });
    assert.equal(store.isValid, true);
    assert.equal(store.token, dummyJwt);
    assert.equal(store.record.email, 'test@example.com');
    assert.equal(notifiedCount, 1);

    store.clear();
    assert.equal(store.isValid, false);
    assert.equal(store.token, '');
    assert.equal(store.record, null);
    assert.equal(notifiedCount, 2);
  });

  test('HTTP Methods and mock fetch dispatch', async () => {
    let capturedRequest = null;

    const mockFetch = async (url, init) => {
      capturedRequest = { url, ...init };
      return new Response(JSON.stringify({ success: true, received: init.body ? JSON.parse(init.body) : null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new PadiBase('http://127.0.0.1:8085', { customFetch: mockFetch });
    client.authStore.save('test_token_123', { id: 'u1' });

    // Test GET
    await client.get('/api/health');
    assert.equal(capturedRequest.method, 'GET');
    assert.equal(capturedRequest.headers['Authorization'], 'Bearer test_token_123');
    assert.equal(capturedRequest.url, 'http://127.0.0.1:8085/api/health');

    // Test POST
    const resPost = await client.post('/api/posts', { title: 'Halo PadiBase' });
    assert.equal(capturedRequest.method, 'POST');
    assert.deepEqual(resPost.received, { title: 'Halo PadiBase' });

    // Test PUT
    await client.put('/api/posts/1', { title: 'Updated' });
    assert.equal(capturedRequest.method, 'PUT');

    // Test PATCH
    await client.patch('/api/posts/1', { title: 'Patched' });
    assert.equal(capturedRequest.method, 'PATCH');

    // Test DELETE
    await client.delete('/api/posts/1');
    assert.equal(capturedRequest.method, 'DELETE');
  });

  test('ClientResponseError on 4xx/5xx', async () => {
    const mockErrorFetch = async (url, init) => {
      return new Response(JSON.stringify({ code: 404, message: 'Record not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new PadiBase('http://127.0.0.1:8085', { customFetch: mockErrorFetch });

    try {
      await client.table('posts').getOne('non_existent');
      assert.fail('Should have thrown ClientResponseError');
    } catch (err) {
      assert.ok(err instanceof ClientResponseError);
      assert.equal(err.status, 404);
      assert.equal(err.message, 'Record not found.');
    }
  });

  test('Table RecordService operations', async () => {
    const calls = [];
    const mockFetch = async (url, init) => {
      calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : null });
      if (url.includes('/records/all') || url.endsWith('/all')) {
        return new Response(JSON.stringify([{ id: '1' }, { id: '2' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ id: 'rec_100', title: 'Test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new PadiBase('http://127.0.0.1:8085', { customFetch: mockFetch });
    const posts = client.table('posts');

    await posts.create({ title: 'New Item' });
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].url, 'http://127.0.0.1:8085/api/posts');

    await posts.update('rec_100', { title: 'New Title' });
    assert.equal(calls[1].method, 'PATCH');
    assert.equal(calls[1].url, 'http://127.0.0.1:8085/api/posts/rec_100');

    await posts.delete('rec_100');
    assert.equal(calls[2].method, 'DELETE');

    const all = await posts.getFullList();
    assert.equal(all.length, 2);
  });

  test('Auth table login and store auto-update', async () => {
    const mockFetch = async (url, init) => {
      return new Response(
        JSON.stringify({
          token: 'token_jwt_auth_user',
          record: { id: 'usr_1', email: 'al@example.com', role: 'admin' },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    const client = new PadiBase('http://127.0.0.1:8085', { customFetch: mockFetch });
    const authRes = await client.table('users').authWithPassword('al@example.com', 'password123');

    assert.equal(authRes.token, 'token_jwt_auth_user');
    assert.equal(client.authStore.token, 'token_jwt_auth_user');
    assert.equal(client.authStore.record.email, 'al@example.com');
  });

  test('FileService URL generation', () => {
    const url = padi.files.getUrl('users', 'rec_1', 'avatar.png', { thumb: '100x100' });
    assert.equal(url, 'http://127.0.0.1:8085/api/files/users/rec_1/avatar.png?thumb=100x100');

    const urlFromObj = padi.files.getUrl({ table: 'posts', id: 'p_2' }, 'cover.jpg');
    assert.equal(urlFromObj, 'http://127.0.0.1:8085/api/files/posts/p_2/cover.jpg');
  });

  test('Realtime topic subscription and matching', () => {
    // Disable auto network connect in unit test
    padi.realtime.autoConnect = false;

    const eventsReceived = [];

    // Subscribe to all posts
    const unsubPosts = padi.table('posts').subscribe('*', (e) => {
      eventsReceived.push({ source: 'posts_all', action: e.action, id: e.record.id });
    });

    // Subscribe to specific post 42
    const unsubPost42 = padi.table('posts').subscribe('42', (e) => {
      eventsReceived.push({ source: 'posts_42', action: e.action, id: e.record.id });
    });

    // Subscribe to all events globally
    const unsubGlobal = padi.realtime.subscribe('*', (e) => {
      eventsReceived.push({ source: 'global', action: e.action, id: e.record.id });
    });

    // Simulate incoming SSE message for posts record 42
    padi.realtime['handleMessage']({
      event: 'message',
      data: JSON.stringify({
        action: 'create',
        table: 'posts',
        collection: 'posts',
        record: { id: '42', title: 'Post 42' },
      }),
    });

    assert.equal(eventsReceived.length, 3);
    assert.ok(eventsReceived.some((e) => e.source === 'posts_all'));
    assert.ok(eventsReceived.some((e) => e.source === 'posts_42'));
    assert.ok(eventsReceived.some((e) => e.source === 'global'));

    // Clear and test event for post 99 (should not trigger posts_42)
    eventsReceived.length = 0;
    padi.realtime['handleMessage']({
      event: 'message',
      data: JSON.stringify({
        action: 'update',
        table: 'posts',
        collection: 'posts',
        record: { id: '99', title: 'Post 99' },
      }),
    });

    assert.equal(eventsReceived.length, 2);
    assert.ok(!eventsReceived.some((e) => e.source === 'posts_42'));

    // Unsubscribe
    unsubPosts();
    unsubPost42();
    unsubGlobal();
  });
});
