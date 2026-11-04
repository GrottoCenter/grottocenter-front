// Workbox serializes this function into the service worker: no free variables.
export const mapDetailCacheKey = async ({ request }) => {
  const url = new globalThis.URL(request.url);
  if (
    !/\/api\/v\d+\/(entrances|caves|massifs|organizations)\/\d+$/.test(
      url.pathname
    )
  )
    return request.url;

  // Detail responses can reveal sensitive/deleted entities according to role.
  // Never reuse another session's response, including old unpartitioned keys.
  // Hash the bearer so the cache URL does not persist the credential itself.
  const authorization = request.headers.get('Authorization');
  let session = 'anonymous';
  if (authorization) {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new globalThis.TextEncoder().encode(authorization)
    );
    session = Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  }
  url.searchParams.set('__gc_session', session);
  return url.toString();
};
