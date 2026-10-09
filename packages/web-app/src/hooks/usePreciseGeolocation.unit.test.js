import { act, renderHook } from '@testing-library/react';
import usePreciseGeolocation from './usePreciseGeolocation';

const makePosition = (accuracy, latitude = 45) => ({
  coords: { latitude, longitude: 5, accuracy }
});

describe('usePreciseGeolocation', () => {
  let geolocation;

  beforeEach(() => {
    vi.useFakeTimers();
    geolocation = {
      watchPosition: vi.fn().mockReturnValue(42),
      clearWatch: vi.fn()
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: geolocation
    });
  });

  afterEach(() => vi.useRealTimers());

  it('lets a coarse first fix converge, ignoring less accurate fixes', () => {
    const onPosition = vi.fn();
    const { result } = renderHook(() => usePreciseGeolocation());
    expect(geolocation.watchPosition).not.toHaveBeenCalled();
    act(() => result.current.locate(onPosition));
    const [onFix, , options] = geolocation.watchPosition.mock.calls[0];
    expect(options).toEqual({
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 60000
    });

    act(() => onFix(makePosition(100)));
    expect(result.current.isLocating).toBe(true);
    act(() => onFix(makePosition(25, 45.1)));
    act(() => onFix(makePosition(80, 45.2)));
    expect(onPosition).toHaveBeenCalledTimes(2);
    expect(onPosition).toHaveBeenLastCalledWith(makePosition(25, 45.1));
    expect(geolocation.clearWatch).not.toHaveBeenCalled();

    act(() => onFix(makePosition(6.4, 45.3)));
    expect(result.current.isLocating).toBe(false);
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
    act(() => onFix(makePosition(4, 45.4)));
    expect(onPosition).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the best available fix when the acquisition deadline expires', () => {
    const onPosition = vi.fn();
    const { result } = renderHook(() => usePreciseGeolocation());
    act(() => result.current.locate(onPosition));
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    act(() => onFix(makePosition(100)));
    act(() => onFix(makePosition(20, 45.1)));
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.isLocating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasTimedOut).toBe(true);
    expect(onPosition).toHaveBeenLastCalledWith(makePosition(20, 45.1));
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
  });

  it('reports a timeout without changing the position if no valid fix arrives', () => {
    const onPosition = vi.fn();
    const { result } = renderHook(() => usePreciseGeolocation());
    act(() => result.current.locate(onPosition));
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    act(() => onFix(makePosition(NaN)));
    act(() => onFix(makePosition(-1)));
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.error).toBe(3);
    expect(result.current.hasTimedOut).toBe(true);
    expect(result.current.isLocating).toBe(false);
    expect(onPosition).not.toHaveBeenCalled();
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
  });

  it('recovers from transient errors but stops immediately on denied access', () => {
    const onPosition = vi.fn();
    const { result } = renderHook(() => usePreciseGeolocation());
    act(() => result.current.locate(onPosition));
    const [onFix, onError] = geolocation.watchPosition.mock.calls[0];
    act(() => onError({ code: 2 }));
    act(() => onError({ code: 3 }));
    expect(result.current.isLocating).toBe(true);
    expect(result.current.error).toBeNull();
    act(() => onFix(makePosition(25)));
    act(() => onError({ code: 1 }));
    expect(result.current.isLocating).toBe(false);
    expect(result.current.error).toBe(1);
    expect(vi.getTimerCount()).toBe(0);

    act(() => result.current.locate(onPosition));
    expect(result.current.error).toBeNull();
    expect(result.current.isLocating).toBe(true);
  });

  it('ignores callbacks from a cancelled or replaced acquisition', () => {
    const onPosition = vi.fn();
    const { result } = renderHook(() => usePreciseGeolocation());
    act(() => result.current.locate(onPosition));
    const [onOldFix, onOldError] = geolocation.watchPosition.mock.calls[0];
    act(() => result.current.locate(onPosition));
    act(() => onOldFix(makePosition(5)));
    act(() => onOldError({ code: 1 }));
    expect(onPosition).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isLocating).toBe(true);
    const [onFix] = geolocation.watchPosition.mock.calls[1];
    act(() => result.current.cancel());
    act(() => onFix(makePosition(5)));
    expect(onPosition).not.toHaveBeenCalled();
    expect(result.current.isLocating).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('releases the GPS and ignores late callbacks on unmount', () => {
    const onPosition = vi.fn();
    const { result, unmount } = renderHook(() => usePreciseGeolocation());
    act(() => result.current.locate(onPosition));
    const [onFix] = geolocation.watchPosition.mock.calls[0];
    unmount();
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
    expect(vi.getTimerCount()).toBe(0);
    act(() => onFix(makePosition(5)));
    expect(onPosition).not.toHaveBeenCalled();
  });

  it('clears the watch even when the provider calls back synchronously', () => {
    geolocation.watchPosition.mockImplementation(onFix => {
      onFix(makePosition(5));
      return 7;
    });
    const { result } = renderHook(() => usePreciseGeolocation());
    act(() => result.current.locate(vi.fn()));
    expect(result.current.isLocating).toBe(false);
    expect(geolocation.clearWatch).toHaveBeenCalledWith(7);
    expect(vi.getTimerCount()).toBe(0);
  });
});
