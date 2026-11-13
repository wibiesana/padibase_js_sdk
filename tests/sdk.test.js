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

  test('FileService / StorageService URL generation and upload', async () => {
    // Storage bucket URL
    const storageUrl = padi.storage.getUrl('avatars', 'avatar.png', { download: 1 });
    assert.equal(storageUrl, 'http://127.0.0.1:8085/api/storage/avatars/avatar.png?download=1');

    // Legacy 3-arg URL compatibility
    const url = padi.files.getUrl('users', 'rec_1', 'avatar.png', { thumb: '100x100' });
    assert.equal(url, 'http://127.0.0.1:8085/api/files/users/rec_1/avatar.png?thumb=100x100');

    const urlFromObj = padi.files.getUrl({ table: 'posts', id: 'p_2' }, 'cover.jpg');
    assert.equal(urlFromObj, 'http://127.0.0.1:8085/api/files/posts/p_2/cover.jpg');

    // Test storage.upload(bucket, file)
    let capturedUrl = '';
    const client = new PadiBase('http://127.0.0.1:8085', {
      customFetch: async (reqUrl) => {
        capturedUrl = reqUrl;
        return new Response(
          JSON.stringify({
            uploaded: true,
            bucket: 'avatars',
            filename: '123_pic.png',
            key: 'avatars/123_pic.png',
            path: '/api/storage/avatars/123_pic.png',
            url: '/api/storage/avatars/123_pic.png',
            size: 1024,
            mime: 'image/png',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      },
    });

    const uploadRes = await client.storage.upload('avatars', new Blob(['hello'], { type: 'image/png' }));
    assert.equal(capturedUrl, 'http://127.0.0.1:8085/api/storage/avatars');
    assert.equal(uploadRes.url, 'http://127.0.0.1:8085/api/storage/avatars/123_pic.png');
    assert.equal(uploadRes.path, '/api/storage/avatars/123_pic.png');
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

  test('Advanced RecordService: first, count, batch-create, batch-delete, export, import', async () => {
    const calls = [];
    const mockFetch = async (url, init) => {
      calls.push({ url, method: init?.method, body: init?.body ? JSON.parse(init.body) : null });

      if (url.includes('/first')) {
        return new Response(JSON.stringify({ id: 'rec_first', title: 'First Post' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/count')) {
        return new Response(JSON.stringify({ collection: 'posts', count: 42, total: 42 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/batch-create')) {
        return new Response(JSON.stringify([{ id: 'b_1' }, { id: 'b_2' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/batch-delete')) {
        return new Response(JSON.stringify({ deleted: 2, ids: ['b_1', 'b_2'] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/export')) {
        return new Response(JSON.stringify([{ id: 'exp_1' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/import')) {
        return new Response(JSON.stringify({ imported: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };

    const client = new PadiBase('http://127.0.0.1:8085', { customFetch: mockFetch });
    const posts = client.table('posts');

    // Test getFirst
    const firstRec = await posts.getFirst({ sort: '-created' });
    assert.equal(firstRec.id, 'rec_first');
    assert.ok(calls[0].url.includes('/api/posts/first?sort=-created'));

    // Test getFirstListItem
    const firstFiltered = await posts.getFirstListItem('status = "active"');
    assert.equal(firstFiltered.id, 'rec_first');

    // Test getCount
    const count = await posts.getCount({ filter: 'status = "active"' });
    assert.equal(count, 42);

    // Test createBatch
    const createdBatch = await posts.createBatch([{ title: 'One' }, { title: 'Two' }]);
    assert.equal(createdBatch.length, 2);
    assert.ok(calls[3].url.includes('/api/posts/batch-create'));

    // Test deleteBatch
    const delRes = await posts.deleteBatch(['b_1', 'b_2']);
    assert.equal(delRes.deleted, 2);
    assert.ok(calls[4].url.includes('/api/posts/batch-delete'));

    // Test export
    const exp = await posts.export();
    assert.equal(exp.length, 1);

    // Test import
    const imp = await posts.import([{ title: 'Imported' }]);
    assert.equal(imp.imported, 1);
  });

  test('AuthService shortcuts and methods (/api/auth/*)', async () => {
    const calls = [];
    const mockFetch = async (url, init) => {
      calls.push({ url, method: init?.method, body: init?.body ? JSON.parse(init.body) : null });

      if (url.endsWith('/api/auth/login')) {
        return new Response(
          JSON.stringify({ token: 'jwt_auth_shortcut', record: { id: 'u_auth', email: 'sh@test.com' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.endsWith('/api/auth/me')) {
        return new Response(
          JSON.stringify({ record: { id: 'u_auth', email: 'sh@test.com', name: 'Updated' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new PadiBase('http://127.0.0.1:8085', { customFetch: mockFetch });

    // Login via padi.auth
    const authRes = await client.auth.login('sh@test.com', 'secret123');
    assert.equal(authRes.token, 'jwt_auth_shortcut');
    assert.equal(client.authStore.token, 'jwt_auth_shortcut');

    // Get Profile & Update Profile
    const profile = await client.auth.getProfile();
    assert.equal(profile.email, 'sh@test.com');

    const updated = await client.auth.updateProfile({ name: 'Updated' });
    assert.equal(updated.name, 'Updated');

    // Password reset and change
    await client.auth.requestPasswordReset('sh@test.com');
    await client.auth.confirmPasswordReset('token_123', 'newpass123');
    await client.auth.changePassword('old123', 'newpass123');

    // Verification
    await client.auth.requestVerification('sh@test.com');
    await client.auth.confirmVerification('verify_token_123');

    // Logout
    await client.auth.logout();
    assert.equal(client.authStore.isValid, false);
  });

  test('AdminService & CollectionService management', async () => {
    const calls = [];
    const mockFetch = async (url, init) => {
      calls.push({ url, method: init?.method });

      if (url.endsWith('/api/admins/has-admins')) {
        return new Response(JSON.stringify({ hasAdmins: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/api/admins/auth-with-password')) {
        return new Response(
          JSON.stringify({ token: 'admin_jwt_123', admin: { id: 'adm_1', email: 'admin@padi.io' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.endsWith('/api/collections')) {
        return new Response(
          JSON.stringify([{ id: 'c_1', name: 'posts' }, { id: 'c_2', name: 'users' }]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new PadiBase('http://127.0.0.1:8085', { customFetch: mockFetch });

    // Admin checks and login
    const hasAdmins = await client.admins.hasAdmins();
    assert.equal(hasAdmins, true);

    const adminAuth = await client.admins.authWithPassword('admin@padi.io', 'pass');
    assert.equal(adminAuth.token, 'admin_jwt_123');
    assert.equal(client.authStore.token, 'admin_jwt_123');

    // Collections
    const list = await client.collections.getList();
    assert.equal(list.length, 2);
    assert.equal(list[0].name, 'posts');
  });

  test('PadiBase batch/transactions, custom SQL, and dynamic custom endpoints', async () => {
    const calls = [];
    const mockFetch = async (url, init) => {
      calls.push({ url, method: init?.method, body: init?.body ? JSON.parse(init.body) : null });

      if (url.endsWith('/api/transactions')) {
        return new Response(
          JSON.stringify({ committed: true, total_operations: 2, results: [{ id: '1' }, { id: '2' }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.endsWith('/api/sql')) {
        return new Response(
          JSON.stringify({ items: [{ total: 100 }], totalItems: 1 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('/api/custom/reports/monthly')) {
        return new Response(
          JSON.stringify({ revenue: 50000 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new PadiBase('http://127.0.0.1:8085', { customFetch: mockFetch });

    // Transaction
    const tx = await client.transaction([
      { action: 'create', collection: 'posts', data: { title: 'First' } },
      { action: 'create', collection: 'posts', data: { title: 'Second' } },
    ]);
    assert.equal(tx.committed, true);
    assert.equal(tx.total_operations, 2);

    // Custom SQL
    const sqlRes = await client.sql('SELECT COUNT(*) as total FROM posts');
    assert.equal(sqlRes.items[0].total, 100);

    // Custom Dynamic Endpoint
    const customRes = await client.custom('reports/monthly');
    assert.equal(customRes.revenue, 50000);
  });
});
