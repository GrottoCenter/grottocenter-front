import { renderHook, act, waitFor } from '@testing-library/react';
import useGeolocationPermission from './useGeolocationPermission';

// A minimal PermissionStatus: a state plus the change listeners the browser
// fires when the user grants or revokes from its own settings.
const makeStatus = state => {
  const listeners = new Set();
  return {
    state,
    addEventListener: (type, fn) => listeners.add(fn),
    removeEventListener: (type, fn) => listeners.delete(fn),
    listenerCount: () => listeners.size,
    emitChange(next) {
      this.state = next;
      listeners.forEach(fn => fn());
    }
  };
};

const setPermissions = value =>
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    writable: true,
    value
  });

describe('useGeolocationPermission', () => {
  it.each(['granted', 'prompt', 'denied'])('reports %s', async state => {
    const status = makeStatus(state);
    setPermissions({ query: vi.fn().mockResolvedValue(status) });

    const { result } = renderHook(() => useGeolocationPermission());

    await waitFor(() => expect(result.current).toBe(state));
  });

  it('queries the geolocation permission without ever asking for a position', async () => {
    const query = vi.fn().mockResolvedValue(makeStatus('granted'));
    setPermissions({ query });

    const { result } = renderHook(() => useGeolocationPermission());
    await waitFor(() => expect(result.current).toBe('granted'));

    // The whole premise: the Permissions API is a read, so it can gate features
    // that would otherwise have to prompt to find out.
    expect(query).toHaveBeenCalledWith({ name: 'geolocation' });
  });

  it('starts out unknown, so nothing gated on "granted" fires too early', () => {
    setPermissions({ query: vi.fn(() => new Promise(() => {})) });

    const { result } = renderHook(() => useGeolocationPermission());

    // The query is async: there is always at least one render before the answer
    // lands. Every consumer condition is written in the positive (=== 'granted')
    // precisely so this window can never auto-start anything.
    expect(result.current).toBe('unknown');
  });

  it('follows a grant or a revocation made from the browser settings', async () => {
    const status = makeStatus('prompt');
    setPermissions({ query: vi.fn().mockResolvedValue(status) });

    const { result } = renderHook(() => useGeolocationPermission());
    await waitFor(() => expect(result.current).toBe('prompt'));

    act(() => status.emitChange('granted'));
    expect(result.current).toBe('granted');

    act(() => status.emitChange('denied'));
    expect(result.current).toBe('denied');
  });

  it('falls back to unknown when the browser has no Permissions API', () => {
    setPermissions(undefined);

    const { result } = renderHook(() => useGeolocationPermission());

    expect(result.current).toBe('unknown');
  });

  it('falls back to unknown when the browser rejects the geolocation name', async () => {
    setPermissions({ query: vi.fn().mockRejectedValue(new TypeError()) });

    const { result } = renderHook(() => useGeolocationPermission());

    // Safari < 16 and some WebViews: we genuinely cannot tell, and saying so is
    // what keeps 'unknown' distinct from 'prompt' for the consumers.
    await waitFor(() => expect(result.current).toBe('unknown'));
  });

  it('detaches its listener on unmount', async () => {
    const status = makeStatus('granted');
    setPermissions({ query: vi.fn().mockResolvedValue(status) });

    const { result, unmount } = renderHook(() => useGeolocationPermission());
    await waitFor(() => expect(result.current).toBe('granted'));
    expect(status.listenerCount()).toBe(1);

    unmount();

    expect(status.listenerCount()).toBe(0);
  });
});
