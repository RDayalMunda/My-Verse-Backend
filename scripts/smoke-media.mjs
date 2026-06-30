/**
 * Smoke test for MongoDB image storage + pagination.
 * Usage: PORT=3001 node scripts/smoke-media.mjs
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
    throw new Error(
      `${method} ${path} → ${res.status}: ${json.meta?.message || JSON.stringify(json)}`,
    );
  }
  return { data: json.data, meta: json.meta };
}

async function uploadImage(path) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), 'smoke.png');
  const res = await fetch(`${base}${path}`, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(`Upload ${path} failed: ${JSON.stringify(json)}`);
  }
  return json.data;
}

async function getImageBytes(mediaId) {
  const res = await fetch(`${base}/media/images/${mediaId}`);
  if (!res.ok) {
    throw new Error(`GET image → ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.startsWith('image/')) {
    throw new Error(`Expected image/* content-type, got ${ct}`);
  }
}

async function main() {
  const login = await req('POST', '/auth/login', {
    body: {
      email: process.env.ADMIN_EMAIL || 'admin@myverse.local',
      password: process.env.ADMIN_PASSWORD || 'change-me-before-deploy',
    },
  });
  const token = login.data.accessToken;

  const imageMeta = await uploadImage('/media/upload');
  if (!imageMeta.mediaId || !imageMeta.url?.includes('/media/images/')) {
    throw new Error('Upload missing mediaId or media url');
  }
  console.log('Profile image upload OK', imageMeta.mediaId);

  await getImageBytes(imageMeta.mediaId);

  const jsonMeta = await req(
    'GET',
    `/media/images/${imageMeta.mediaId}?format=json`,
  );
  if (
    !jsonMeta.data.base64 ||
    !jsonMeta.data.dataUri?.startsWith('data:image/')
  ) {
    throw new Error('format=json missing base64/dataUri');
  }
  console.log('Image serve + JSON virtuals OK');

  const staffList = await req('GET', '/staff?page=1&perPage=5');
  if (
    !staffList.meta ||
    staffList.meta.page !== 1 ||
    staffList.meta.perPage !== 5 ||
    typeof staffList.meta.total !== 'number'
  ) {
    throw new Error('Staff list missing pagination meta');
  }
  console.log('Staff pagination OK', staffList.meta);

  const usersList = await req('GET', '/users?page=1&perPage=10', { token });
  if (!usersList.meta?.perPage || usersList.meta.perPage !== 10) {
    throw new Error('Users list missing perPage meta');
  }
  console.log('Users pagination OK', usersList.meta);

  const projectsList = await req('GET', '/projects?page=1&perPage=5');
  if (projectsList.meta?.perPage !== 5) {
    throw new Error('Projects list missing perPage meta');
  }
  console.log('Projects pagination OK', projectsList.meta);

  const projectImage = await uploadImage('/media/upload/image');
  const book = await req('POST', '/projects', {
    token,
    body: { type: 'BOOK', title: `Smoke Media ${Date.now()}` },
  });
  const section = await req('POST', `/projects/${book.data.id}/sections`, {
    token,
    body: { label: 'Images' },
  });
  await req('POST', `/projects/${book.data.id}/sections/${section.data.id}/items`, {
    token,
    body: { kind: 'IMAGE', file: projectImage },
  });
  console.log('Project image item OK');

  console.log('All smoke-media checks passed.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
