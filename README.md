# 🌾 PadiBase JavaScript / TypeScript SDK

Official client SDK for **[PadiBase](https://github.com/)** (Backend-as-a-Service in Rust).  
Engineered for ultra-fast performance, zero external dependencies, **direct HTTP methods**, and **Auto Realtime (Server-Sent Events)** streaming.

> ⚡ **Backend-Driven Performance**: Schema definitions, auto-loading relations (`auto_load_relations`), field projections, and security access rules are configured directly in your PadiBase dashboard. The client SDK stays lean and blazing fast without redundant client-side queries or overhead!

---

## 📑 Table of Contents

- [⚡ Highlights](#-highlights)
- [📦 Installation & Setup](#-installation--setup)
- [🧱 Recommended Project Structure & Shared Singleton (DRY)](#-recommended-project-structure--shared-singleton-dry)
- [🌐 Direct HTTP Methods](#-direct-http-methods)
- [📂 Table & Records CRUD](#-table--records-crud)
- [🔐 Authentication & User Account Flows](#-authentication--user-account-flows)
  - [1. User Sign In](#1-user-sign-in)
  - [2. User Registration](#2-user-registration)
  - [3. Profile & Session](#3-profile--session)
  - [4. Sign Out & Reactive Auth Listener](#4-sign-out--reactive-auth-listener)
- [⚡ Auto Realtime Subscriptions (SSE)](#-auto-realtime-subscriptions-sse)
- [📁 File Storage & Media Attachments](#-file-storage--media-attachments)
- [🛠️ Error Handling (`ClientResponseError`)](#️-error-handling-clientresponseerror)
- [💡 Complete Framework Guides & Examples](#-complete-framework-guides--examples)
  - [1. Vue 3 (Composition API `<script setup>`)](#1-vue-3-composition-api-script-setup)
  - [2. React (Next.js / Vite Hooks)](#2-react-nextjs--vite-hooks)
  - [3. Svelte 4 / 5](#3-svelte-4--5)
  - [4. Dedicated Auth Module (`src/services/auth.js`)](#4-dedicated-auth-module-srcservicesauthjs)
- [📄 License](#-license)

---

## ⚡ Highlights

- **🚀 Ultra Lean & Zero Dependencies**: Lightweight and fast. Runs in Browsers, Node.js 18+, Bun, Deno, React Native, Next.js, Nuxt, SvelteKit, and Vite.
- **⚡ Backend-Managed Relations & Projections**: No need to manually pass `with` or select fields. When enabled in the backend dashboard, relations and column filters are automatically resolved server-side for maximum speed and minimal network traffic.
- **🌐 Effortless Direct HTTP Methods**: Dedicated `padi.get()`, `padi.post()`, `padi.put()`, `padi.patch()`, `padi.delete()`, and `padi.send()` with automatic JSON serialization, multipart `FormData` boundary handling, and Bearer token injection.
- **⚡ Auto Realtime Streaming**: Built on SSE `/api/realtime`. Automatically connects upon first subscription, auto-reconnects with exponential backoff, dynamically refreshes authorization tokens, and disconnects when all listeners are cleared.
- **🔐 State-Aware AuthStore**: Stores JWT tokens and user records in browser `localStorage` (with seamless in-memory fallback for SSR/Node.js) and triggers reactive `onChange` events.

---

## 📦 Installation & Setup

### Option 1: Install from your local project directory
```bash
# Inside your frontend app root:
npm install ./padi_js_sdk
```

### Option 2: Direct ESM import
```javascript
import PadiBase from './padi_js_sdk/dist/index.js';
```

---

## 🧱 Recommended Project Structure & Shared Singleton (DRY)

Instead of re-initializing `new PadiBase(...)` repeatedly in every component or page, **follow the DRY (Don't Repeat Yourself) principle**: initialize the client **once** in a dedicated helper file and export it across your app.

### Create a Singleton Helper File (`src/lib/padi.js` or `src/lib/padi.ts`)

```javascript
// src/lib/padi.js (or src/lib/padi.ts)
import PadiBase from 'padibase';

// Single shared client instance for the entire application
export const padi = new PadiBase(
  import.meta.env?.VITE_PADIBASE_URL || 'http://127.0.0.1:8085'
);

export default padi;
```

#### Why use this singleton pattern?
1. **DRY & Clean**: Your backend URL and client configs are defined in one place.
2. **Shared Auth State**: When a user signs in (`padi.table('users').authWithPassword(...)`), the token is stored in the shared `padi.authStore` and immediately accessible to all other components without prop-drilling.
3. **Single Realtime Connection**: Reuses a single SSE stream across your entire application instead of opening duplicate network connections.

---

## 🌐 Direct HTTP Methods

PadiBase SDK provides direct, ergonomic methods to call any endpoint:

```javascript
import { padi } from '@/lib/padi';

// 1. GET Request
const health = await padi.get('/api/health');

// 2. GET with search and sort
const users = await padi.get('/api/users/all', {
  query: {
    sort: '-created',
    search: 'john'
  }
});

// 3. POST Request with JSON Body
const newPost = await padi.post('/api/posts', {
  title: 'My First Post',
  content: 'Hello from PadiBase SDK!'
});

// 4. PUT & PATCH Requests
const updated = await padi.patch('/api/posts/rec_123', {
  views: 2500
});

// 5. DELETE Request
await padi.delete('/api/posts/rec_123');

// 6. Generic send() for custom endpoints
const customResult = await padi.send('/api/custom/reports', {
  method: 'POST',
  body: { year: 2026 }
});

// 7. Safe File URL Builder
const avatarUrl = padi.buildUrl('/api/files/users/u1/avatar.png');
```

> 🔒 **Automatic Bearer Token**: When a user signs in, the SDK automatically attaches the `Authorization: Bearer <token>` header to all HTTP requests!

---

## 📂 Table & Records CRUD

Use `padi.table('tableName')` or `padi.from('tableName')`.

```javascript
import { padi } from '@/lib/padi';

// 1. Paginated records list (getList)
// Relations are automatically eager-loaded by the backend!
const result = await padi.table('posts').getList(1, 20, {
  filter: 'status = "published"',
  sort: '-created'
});

console.log('Total Items:', result.totalItems);
console.log('Current Page:', result.page);
console.log('Records:', result.items);

// 2. Fetch all records without pagination (getFullList / getAll)
const allPosts = await padi.table('posts').getFullList({
  sort: '-created'
});

// 3. Fetch single record by ID
const post = await padi.table('posts').getOne('rec_123');

// 4. Create record (JSON or direct FormData upload)
const newPost = await padi.table('posts').create({ title: 'New Article' });

const formData = new FormData();
formData.append('title', 'Article with Cover');
formData.append('cover', fileInput.files[0]);
const recordWithFile = await padi.table('posts').create(formData);

// 5. Update & Delete record
await padi.table('posts').update('rec_123', { title: 'Updated Title' });
await padi.table('posts').delete('rec_123');
```

---

## 🔐 Authentication & User Account Flows

```javascript
import { padi } from '@/lib/padi';

// 1. User Sign In (Email or Username + Password)
const authData = await padi.table('users').authWithPassword('john@example.com', 'secret_password_123');
console.log('JWT Token:', padi.authStore.token);
console.log('User Record:', padi.authStore.record);
console.log('Is Logged In:', padi.authStore.isValid);

// 2. User Registration
const newUser = await padi.table('users').register({
  email: 'john@example.com',
  username: 'johndoe',
  password: 'Password123!',
  passwordConfirm: 'Password123!',
  name: 'John Doe'
});

// 3. Profile Management
const profile = await padi.table('users').getProfile();

// 4. Sign Out
await padi.table('users').logout();

// 5. Reactive Auth Listener
padi.authStore.onChange((token, record) => {
  if (token) {
    console.log('User logged in:', record.email);
  } else {
    console.log('User logged out');
  }
});
```

---

## ⚡ Auto Realtime Subscriptions (SSE)

Realtime streaming is powered by Server-Sent Events (SSE) at `/api/realtime`.

```javascript
import { padi } from '@/lib/padi';

// 1. Subscribe to creates, updates, and deletes in the 'posts' table
const unsubscribe = padi.table('posts').subscribe('*', (e) => {
  console.log('Action:', e.action);   // "create" | "update" | "delete"
  console.log('Table:', e.table);     // "posts"
  console.log('Record:', e.record);   // { id: "...", title: "...", ... }
});

// Unsubscribe whenever needed:
unsubscribe();

// 2. Subscribe to a specific record by ID:
const unsubRecord = padi.table('posts').subscribe('rec_01h8xyz', (e) => {
  console.log('Post updated:', e.record);
});

// 3. Global multi-table subscription:
padi.realtime.subscribe('*', (e) => {
  console.log(`[REALTIME] Table: ${e.table} | Action: ${e.action}`, e.record);
});

// 4. Unsubscribe from all topics:
padi.realtime.unsubscribe();
```

---

## 📁 File Storage & Attachments

```javascript
import { padi } from '@/lib/padi';

// 1. Build File URL:
const avatarUrl = padi.files.getUrl('users', 'usr_1', 'avatar.png');
const thumbUrl = padi.files.getUrl('users', 'usr_1', 'avatar.png', { thumb: '100x100' });

// 2. Upload standalone file attachment:
await padi.files.upload('posts', 'rec_123', fileInputElement.files[0], 'cover');
```

---

## 🛠️ Error Handling (`ClientResponseError`)

```javascript
import { padi } from '@/lib/padi';
import { ClientResponseError } from 'padibase';

try {
  await padi.table('posts').create({ title: '' });
} catch (err) {
  if (err instanceof ClientResponseError) {
    console.error('HTTP Status:', err.status);     // e.g. 400
    console.error('Error Message:', err.message);  // Friendly error message
    console.error('Error Data:', err.data);        // Server JSON response
    console.error('Request URL:', err.url);        // Failed endpoint
  } else {
    console.error('Unexpected error:', err);
  }
}
```

---

## 💡 Complete Framework Guides & Examples

### 1. Vue 3 (Composition API `<script setup>`)

```vue
<!-- src/components/PadiDashboard.vue -->
<template>
  <div class="app-container">
    <section v-if="!currentUser">
      <h2>{{ isRegistering ? 'Register Account' : 'Sign In' }}</h2>
      <form @submit.prevent="handleSubmitAuth">
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-if="isRegistering" v-model="username" placeholder="Username" required />
        <input v-model="password" type="password" placeholder="Password" required />
        <button type="submit">{{ isRegistering ? 'Create Account' : 'Login' }}</button>
      </form>
      <p @click="isRegistering = !isRegistering" style="cursor: pointer; color: blue;">
        {{ isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register" }}
      </p>
      <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
    </section>

    <section v-else>
      <header>
        <h3>Welcome, {{ currentUser.email }}</h3>
        <button @click="handleLogout">Logout</button>
      </header>

      <form @submit.prevent="createPost">
        <input v-model="newTitle" placeholder="Post title..." required />
        <button type="submit">Publish</button>
      </form>

      <h3>Realtime Posts ({{ posts.length }})</h3>
      <ul>
        <li v-for="post in posts" :key="post.id">
          <span>{{ post.title }}</span>
          <button @click="deletePost(post.id)">Delete</button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { padi } from '@/lib/padi';

const currentUser = ref(padi.authStore.record);
const isRegistering = ref(false);
const email = ref('');
const username = ref('');
const password = ref('');
const errorMessage = ref('');

const posts = ref([]);
const newTitle = ref('');
let unsubscribeRealtime = null;

async function handleSubmitAuth() {
  errorMessage.value = '';
  try {
    if (isRegistering.value) {
      await padi.table('users').register({
        email: email.value,
        username: username.value,
        password: password.value,
        passwordConfirm: password.value,
      });
      await padi.table('users').authWithPassword(email.value, password.value);
    } else {
      await padi.table('users').authWithPassword(email.value, password.value);
    }
    currentUser.value = padi.authStore.record;
    loadPosts();
  } catch (err) {
    errorMessage.value = err.message || 'Authentication failed';
  }
}

async function handleLogout() {
  await padi.table('users').logout();
  currentUser.value = null;
  posts.value = [];
}

async function loadPosts() {
  posts.value = await padi.table('posts').getFullList({ sort: '-created' });
}

async function createPost() {
  if (!newTitle.value.trim()) return;
  await padi.table('posts').create({ title: newTitle.value });
  newTitle.value = '';
}

async function deletePost(id) {
  await padi.table('posts').delete(id);
}

onMounted(() => {
  padi.authStore.onChange((token, record) => {
    currentUser.value = record;
  });

  if (padi.authStore.isValid) {
    loadPosts();
  }

  // Auto Realtime Subscription on 'posts' table
  unsubscribeRealtime = padi.table('posts').subscribe('*', (e) => {
    if (e.action === 'create') {
      posts.value.unshift(e.record);
    } else if (e.action === 'update') {
      const idx = posts.value.findIndex(p => p.id === e.record.id);
      if (idx !== -1) posts.value[idx] = e.record;
    } else if (e.action === 'delete') {
      posts.value = posts.value.filter(p => p.id !== e.record.id);
    }
  });
});

onUnmounted(() => {
  if (unsubscribeRealtime) unsubscribeRealtime();
});
</script>
```

---

### 2. React (Next.js / Vite Hooks)

```tsx
// src/components/PadiApp.tsx
import React, { useState, useEffect } from 'react';
import { padi } from '@/lib/padi';

export default function PadiApp() {
  const [user, setUser] = useState(padi.authStore.record);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribeAuth = padi.authStore.onChange((token, record) => {
      setUser(record);
    });

    if (padi.authStore.isValid) {
      padi.table('posts').getFullList({ sort: '-created' }).then(setPosts);
    }

    // Auto Realtime subscription on 'posts' table
    const unsubscribeRealtime = padi.table('posts').subscribe('*', (e) => {
      if (e.action === 'create') {
        setPosts((prev) => [e.record, ...prev]);
      } else if (e.action === 'update') {
        setPosts((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)));
      } else if (e.action === 'delete') {
        setPosts((prev) => prev.filter((item) => item.id !== e.record.id));
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRealtime();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await padi.table('users').register({
          email,
          username,
          password,
          passwordConfirm: password,
        });
        await padi.table('users').authWithPassword(email, password);
      } else {
        await padi.table('users').authWithPassword(email, password);
      }
      padi.table('posts').getFullList({ sort: '-created' }).then(setPosts);
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await padi.table('posts').create({ title });
    setTitle('');
  };

  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '40px auto' }}>
        <h2>{isRegister ? 'Register' : 'Sign In'}</h2>
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 8 }}
          />
          {isRegister && (
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 8 }}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 8 }}
          />
          <button type="submit" style={{ width: '100%' }}>
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p onClick={() => setIsRegister(!isRegister)} style={{ cursor: 'pointer', color: 'blue' }}>
          {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Logged in as: {user.email}</h3>
        <button onClick={() => padi.table('users').logout()}>Logout</button>
      </header>

      <form onSubmit={handleCreatePost} style={{ margin: '20px 0' }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New post title..."
          style={{ width: '75%', marginRight: 8 }}
        />
        <button type="submit">Add Post</button>
      </form>

      <h4>Realtime Posts ({posts.length})</h4>
      <ul>
        {posts.map((post) => (
          <li key={post.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>{post.title}</span>
            <button onClick={() => padi.table('posts').delete(post.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 3. Svelte 4 / 5

```svelte
<!-- src/routes/+page.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { padi } from '$lib/padi';

  let user = padi.authStore.record;
  let email = '';
  let password = '';
  let posts = [];
  let newTitle = '';
  let unsubRealtime;

  async function login() {
    await padi.table('users').authWithPassword(email, password);
    user = padi.authStore.record;
    loadPosts();
  }

  async function logout() {
    await padi.table('users').logout();
    user = null;
    posts = [];
  }

  async function loadPosts() {
    posts = await padi.table('posts').getFullList({ sort: '-created' });
  }

  async function createPost() {
    if (!newTitle.trim()) return;
    await padi.table('posts').create({ title: newTitle });
    newTitle = '';
  }

  onMount(() => {
    if (padi.authStore.isValid) {
      loadPosts();
    }

    // Auto Realtime subscription on 'posts' table
    unsubRealtime = padi.table('posts').subscribe('*', (e) => {
      if (e.action === 'create') posts = [e.record, ...posts];
      if (e.action === 'update') posts = posts.map(p => p.id === e.record.id ? e.record : p);
      if (e.action === 'delete') posts = posts.filter(p => p.id !== e.record.id);
    });
  });

  onDestroy(() => {
    if (unsubRealtime) unsubRealtime();
  });
</script>

{#if !user}
  <form on:submit|preventDefault={login}>
    <input bind:value={email} type="email" placeholder="Email" required />
    <input bind:value={password} type="password" placeholder="Password" required />
    <button type="submit">Sign In</button>
  </form>
{:else}
  <div>
    <span>Signed in as {user.email}</span>
    <button on:click={logout}>Sign Out</button>

    <form on:submit|preventDefault={createPost}>
      <input bind:value={newTitle} placeholder="Title..." />
      <button type="submit">Create</button>
    </form>

    <ul>
      {#each posts as post (post.id)}
        <li>
          {post.title}
          <button on:click={() => padi.table('posts').delete(post.id)}>X</button>
        </li>
      {/each}
    </ul>
  </div>
{/if}
```

---

### 4. Dedicated Auth Module (`src/services/auth.js`)

```javascript
// src/services/auth.js
import { padi } from '@/lib/padi';

/**
 * Signs in a user using email or username and password
 */
export async function loginUser(email, password) {
  return await padi.table('users').authWithPassword(email, password);
}

/**
 * Registers a new user account
 */
export async function registerUser(userData) {
  return await padi.table('users').register(userData);
}

/**
 * Signs out the current user and clears local session
 */
export async function logoutUser() {
  return await padi.table('users').logout();
}

/**
 * Returns current logged-in user record (or null if anonymous)
 */
export function getCurrentUser() {
  return padi.authStore.record;
}

/**
 * Checks whether user has an active, unexpired token
 */
export function isUserLoggedIn() {
  return padi.authStore.isValid;
}
```

---

## 📄 License

Distributed under the **MIT License**. Free for personal and commercial use.

© 2026 PadiBase Team.
