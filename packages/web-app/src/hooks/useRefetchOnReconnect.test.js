import { act, renderHook } from '@testing-library/react';
import { useRefetchOnReconnect } from './useRefetchOnReconnect';

const setOnLine = value => {
  Object.defineProperty(window.navigator, 'onLine', {
    value,
    configurable: true
  });
};

const goOffline = () => {
  act(() => {
    setOnLine(false);
    window.dispatchEvent(new Event('offline'));
  });
};

const goOnline = () => {
  act(() => {
    setOnLine(true);
    window.dispatchEvent(new Event('online'));
  });
};

describe('useRefetchOnReconnect', () => {
  beforeEach(() => setOnLine(true));

  it('does not fire on mount while online', () => {
    const refetch = vi.fn();
    renderHook(() => useRefetchOnReconnect(refetch));
    expect(refetch).not.toHaveBeenCalled();
  });

  it('does not fire on mount while offline', () => {
    setOnLine(false);
    const refetch = vi.fn();
    renderHook(() => useRefetchOnReconnect(refetch));
    expect(refetch).not.toHaveBeenCalled();
  });

  it('fires once when the connection comes back', () => {
    const refetch = vi.fn();
    renderHook(() => useRefetchOnReconnect(refetch));

    goOffline();
    expect(refetch).not.toHaveBeenCalled();

    goOnline();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('does not fire again without a new disconnection', () => {
    const refetch = vi.fn();
    renderHook(() => useRefetchOnReconnect(refetch));

    goOffline();
    goOnline();
    goOnline();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('fires again after a second disconnection', () => {
    const refetch = vi.fn();
    renderHook(() => useRefetchOnReconnect(refetch));

    goOffline();
    goOnline();
    goOffline();
    goOnline();

    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it('stays silent when disabled — nothing to repair', () => {
    const refetch = vi.fn();
    renderHook(() => useRefetchOnReconnect(refetch, false));

    goOffline();
    goOnline();

    expect(refetch).not.toHaveBeenCalled();
  });

  it('calls the latest callback, not the one captured on mount', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useRefetchOnReconnect(cb), {
      initialProps: { cb: first }
    });

    goOffline();
    rerender({ cb: second });
    goOnline();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
