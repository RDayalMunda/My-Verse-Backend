/**
 * Phase 2 smoke test — run after `npm run build` with server on PORT (default 3001).
 * Usage: PORT=3001 node scripts/smoke-phase2.mjs
 */
const base = `http://localhost:${process.env.PORT || 3001}/api/v1`;

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(`${method} ${path} → ${res.status}: ${json.meta?.message || JSON.stringify(json)}`);
  }
  return json.data;
}

async function main() {
  const login = await req('POST', '/auth/login', {
    body: {
      email: process.env.ADMIN_EMAIL || 'admin@myverse.local',
      password: process.env.ADMIN_PASSWORD || 'change-me-before-deploy',
    },
  });
  const token = login.accessToken;

  const book = await req('POST', '/projects', {
    token,
    body: { type: 'BOOK', title: `Smoke Book ${Date.now()}` },
  });
  const section = await req('POST', `/projects/${book.id}/sections`, {
    token,
    body: { label: 'Chapter 1' },
  });
  await req('POST', `/projects/${book.id}/sections/${section.id}/items`, {
    token,
    body: { kind: 'TEXT', textContent: 'Once upon a time...' },
  });
  await req('POST', `/projects/${book.id}/sections/${section.id}/publish`, { token });
  await req('POST', `/projects/${book.id}/publish`, { token });

  const publicView = await req('GET', `/projects/${book.id}`);
  if (!publicView.sections?.length || publicView.sections[0].status !== 'PUBLISHED') {
    throw new Error('Public view missing published section');
  }
  console.log('BOOK flow OK');

  const ps = await req('POST', '/projects', {
    token,
    body: { type: 'PHOTOSHOOT', title: `Smoke PS ${Date.now()}` },
  });
  const psSec = await req('POST', `/projects/${ps.id}/sections`, {
    token,
    body: { label: 'Session 1' },
  });

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), 'smoke.png');
  const uploadRes = await fetch(`${base}/media/upload/image`, { method: 'POST', body: form });
  const uploadJson = await uploadRes.json();
  if (!uploadRes.ok) throw new Error('Image upload failed');
  await req('POST', `/projects/${ps.id}/sections/${psSec.id}/items`, {
    token,
    body: { kind: 'IMAGE', label: 'Shot 1', file: uploadJson.data },
  });
  console.log('PHOTOSHOOT flow OK');

  const show = await req('POST', '/projects', {
    token,
    body: { type: 'SHOW', title: `Smoke Show ${Date.now()}` },
  });
  await req('POST', `/projects/${show.id}/sections`, {
    token,
    body: { label: 'Episode 1' },
  });
  console.log('SHOW flow OK');

  console.log('All Phase 2 smoke tests passed');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
