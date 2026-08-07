import { renderHook, act } from '@testing-library/react';
import useWakeLock from './useWakeLock';

const setVisibility = state =>
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state
  });

describe('useWakeLock', () => {
  let sentinel;
  let wakeLock;

  const setWakeLock = value =>
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      writable: true,
      value
    });

  beforeEach(() => {
    setVisibility('visible');
    sentinel = { release: vi.fn(), addEventListener: vi.fn() };
    wakeLock = { request: vi.fn().mockResolvedValue(sentinel) };
    setWakeLock(wakeLock);
  });

  it('stays out of the way while inactive', () => {
    renderHook(() => useWakeLock(false));
    expect(wakeLock.request).not.toHaveBeenCalled();
  });

  it('holds a screen lock while active and releases it on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock(true));
    await act(async () => {});

    expect(wakeLock.request).toHaveBeenCalledWith('screen');
    unmount();
    expect(sentinel.release).toHaveBeenCalled();
  });

  it('re-acquires the lock the browser dropped while the page was hidden', async () => {
    renderHook(() => useWakeLock(true));
    await act(async () => {});

    // Browsers release the lock by themselves as soon as the page is hidden.
    const onRelease = sentinel.addEventListener.mock.calls[0][1];
    act(() => onRelease());
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(wakeLock.request).toHaveBeenCalledTimes(2);
  });

  it('is a no-op on a browser without the API', () => {
    setWakeLock(undefined);
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
