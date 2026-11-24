// The page owns the pause. The worker only reports background 429s that a
// cached response can hide; it keeps no quota state and never blocks fetches.
export const mapRateLimitPlugin = {
  fetchDidSucceed: async ({ response, request, event }) => {
    if (response.status === 429) {
      const client = await globalThis.clients.get(event.clientId);
      client?.postMessage({
        type: 'grottocenter-map-rate-limit',
        retryAfter: response.headers.get('Retry-After'),
        isAuthenticated: request.headers.has('Authorization')
      });
    }
    return response;
  }
};
