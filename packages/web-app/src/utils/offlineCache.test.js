import {
  clearOfflineData,
  getOfflineDataUsage,
  isOwnedCache,
  rememberOfflineBaseline
} from './offlineCache';

const BASELINE_KEY = 'offlineStorageBaseline';

const mockEstimate = usage => {
  const estimate = vi.fn().mockResolvedValue({ usage });
  Object.defineProperty(navigator, 'storage', {
    value: { estimate },
    configurable: true
  });
  return estimate;
};

// Successive readings, mimicking a quota figure that only catches up once the
// browser has finished purging the deleted caches.
const mockEstimateSequence = usages => {
  let i = 0;
  const estimate = vi.fn().mockImplementation(() => {
    const usage = usages[Math.min(i, usages.length - 1)];
    i += 1;
    return Promise.resolve({ usage });
  });
  Object.defineProperty(navigator, 'storage', {
    value: { estimate },
    configurable: true
  });
  return estimate;
};

beforeEach(() => {
  localStorage.clear();
});

describe('getOfflineDataUsage', () => {
  it('reports the raw total while no floor is known', async () => {
    mockEstimate(30_000_000);
    expect(await getOfflineDataUsage()).toBe(30_000_000);
  });

  it('subtracts the remembered floor', async () => {
    mockEstimate(30_000_000);
    localStorage.setItem(BASELINE_KEY, '9000000');
    expect(await getOfflineDataUsage()).toBe(21_000_000);
  });

  it('reports zero, never a negative size, when the total falls below the floor', async () => {
    mockEstimate(7_000_000);
    localStorage.setItem(BASELINE_KEY, '9000000');
    expect(await getOfflineDataUsage()).toBe(0);
  });

  it('lowers a stale floor instead of clamping on every read', async () => {
    mockEstimate(7_000_000);
    localStorage.setItem(BASELINE_KEY, '9000000');
    await getOfflineDataUsage();
    expect(localStorage.getItem(BASELINE_KEY)).toBe('7000000');
  });

  it('ignores a corrupted floor', async () => {
    mockEstimate(30_000_000);
    localStorage.setItem(BASELINE_KEY, 'not-a-number');
    expect(await getOfflineDataUsage()).toBe(30_000_000);
  });

  it('returns null when the Storage API is unavailable', async () => {
    Object.defineProperty(navigator, 'storage', {
      value: undefined,
      configurable: true
    });
    expect(await getOfflineDataUsage()).toBeNull();
  });
});

describe('rememberOfflineBaseline', () => {
  it('keeps the lowest sample, not the first one the browser reports', async () => {
    mockEstimateSequence([40_000_000, 40_000_000, 9_000_000]);
    await rememberOfflineBaseline(3, 0);
    expect(localStorage.getItem(BASELINE_KEY)).toBe('9000000');
  });

  it('settles on a stable reading when the clear freed nothing', async () => {
    mockEstimateSequence([9_000_000]);
    await rememberOfflineBaseline(3, 0);
    expect(localStorage.getItem(BASELINE_KEY)).toBe('9000000');
  });

  it('overwrites a previous floor rather than keeping the lower of the two', async () => {
    localStorage.setItem(BASELINE_KEY, '2000000');
    mockEstimateSequence([9_000_000]);
    await rememberOfflineBaseline(2, 0);
    expect(localStorage.getItem(BASELINE_KEY)).toBe('9000000');
  });

  it('records nothing when the Storage API is unavailable', async () => {
    Object.defineProperty(navigator, 'storage', {
      value: undefined,
      configurable: true
    });
    await rememberOfflineBaseline(2, 0);
    expect(localStorage.getItem(BASELINE_KEY)).toBeNull();
  });
});

describe('cache ownership', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('production only owns unsuffixed caches', () => {
    expect(isOwnedCache('api-get', '')).toBe(true);
    expect(isOwnedCache('api-get-pr-7', '')).toBe(false);
  });

  it('a preview only owns its own caches', () => {
    expect(isOwnedCache('api-get-pr-7', '-pr-7')).toBe(true);
    expect(isOwnedCache('api-get-pr-8', '-pr-7')).toBe(false);
    expect(isOwnedCache('api-get', '-pr-7')).toBe(false);
  });

  it('clearOfflineData spares precaches and other previews', async () => {
    const names = [
      'workbox-precache-v2-x',
      'pr-7-precache-v2-x',
      'api-get-pr-7',
      'api-get-pr-8',
      'api-get'
    ];
    const del = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('caches', { keys: async () => names, delete: del });
    await clearOfflineData('-pr-7');
    expect(del.mock.calls.map(c => c[0])).toEqual(['api-get-pr-7']);
    await clearOfflineData('');
    expect(del.mock.calls.map(c => c[0])).toContain('api-get');
    expect(del.mock.calls.map(c => c[0])).not.toContain('api-get-pr-8');
  });
});
