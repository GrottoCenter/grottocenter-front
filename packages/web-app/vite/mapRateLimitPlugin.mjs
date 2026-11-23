export const mapRateLimitPlugin = {
  requestWillFetch: async ({ request }) => {
    if (globalThis.grottocenterMapRateLimit?.retryAt > Date.now()) {
      // Workbox can still serve its cached response when this fetch is skipped.
      throw new Error('Map rate limit');
    }
    return request;
  },
  fetchDidSucceed: async ({ response }) => {
    if (response.status === 429) {
      // Workbox serializes callbacks without their imports. Keep this small
      // Retry-After parser local (same contract as mapClient) rather than
      // introducing an emitted runtime script just to share it.
      const now = Date.now();
      const value = response.headers.get('Retry-After')?.trim();
      const seconds = Number(value);
      const parsed = Number.isFinite(seconds)
        ? now + seconds * 1000
        : Date.parse(value);
      const hasServerDeadline =
        Boolean(value) && Number.isFinite(parsed) && !(seconds < 0);
      const next = {
        retryAt: hasServerDeadline
          ? Math.max(now + 1000, parsed)
          : now + 10 * 60 * 1000,
        hasServerDeadline
      };
      const previous = globalThis.grottocenterMapRateLimit;
      const deadline = previous?.retryAt > next.retryAt ? previous : next;
      globalThis.grottocenterMapRateLimit = deadline;
      // A cached 200 can hide this background 429 from the page's transport.
      const clients = await globalThis.clients.matchAll({ type: 'window' });
      clients.forEach(client =>
        // Explicit fields avoid config-bundler spread helpers leaking into
        // the serialized worker callback as out-of-scope bindings.
        client.postMessage({
          type: 'grottocenter-map-rate-limit',
          retryAt: deadline.retryAt,
          hasServerDeadline: deadline.hasServerDeadline
        })
      );
    }
    return response;
  }
};
