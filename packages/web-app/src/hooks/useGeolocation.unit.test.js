import { renderHook, act } from '@testing-library/react';
import useGeolocation from './useGeolocation';

const makePosition = (overrides = {}) => ({
  coords: {
    latitude: 45.1,
    longitude: 5.7,
    accuracy: 12,
    heading: null,
    speed: null,
    ...overrides
  }
});

const setVisibility = state =>
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state
  });

const goToBackgroundAndBack = () => {
  setVisibility('hidden');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  setVisibility('visible');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
};

describe('useGeolocation', () => {
  let geolocation;

  beforeEach(() => {
    geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn().mockReturnValue(42),
      clearWatch: vi.fn()
    };
    Object.defineProperty(navigator, 'geolocation', {
      value: geolocation,
      configurable: true,
      writable: true
    });
    setVisibility('visible');
  });

  it('requests a coarse fix with a finite timeout by default (opt in to GPS)', () => {
    renderHook(() => useGeolocation());
    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    const options = geolocation.getCurrentPosition.mock.calls[0][2];
    expect(options).toEqual({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 10000
    });
  });

  it('respects enableHighAccuracy=true when the consumer needs GPS', () => {
    renderHook(() => useGeolocation({ enableHighAccuracy: true }));
    const options = geolocation.getCurrentPosition.mock.calls[0][2];
    expect(options.enableHighAccuracy).toBe(true);
  });

  it('drops the per-fix timeout and the position cache when watching', () => {
    renderHook(() => useGeolocation({ watch: true }));
    const options = geolocation.watchPosition.mock.calls[0][2];
    // A finite timeout applies to EVERY acquisition, so it turns an ordinary
    // slow field fix into a TIMEOUT error; a watch used for navigation also
    // wants the freshest fix rather than a cached one.
    // 0xFFFFFFFF and 0 are the spec's own defaults for these two members.
    expect(options).toEqual({
      enableHighAccuracy: false,
      timeout: 0xffffffff,
      maximumAge: 0
    });
  });

  it('stays dormant while disabled (no prompt, no tracking)', () => {
    renderHook(() => useGeolocation({ enabled: false, watch: true }));
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(geolocation.watchPosition).not.toHaveBeenCalled();
  });

  it('watches the position and clears the watch on unmount', () => {
    const { unmount } = renderHook(() => useGeolocation({ watch: true }));
    expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
    unmount();
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
  });

  it('exposes the position, accuracy and an active status', () => {
    const { result } = renderHook(() => useGeolocation());
    const onPosition = geolocation.getCurrentPosition.mock.calls[0][0];
    act(() => onPosition(makePosition()));

    expect(result.current.location).toEqual({ lat: 45.1, lng: 5.7 });
    expect(result.current.accuracy).toBe(12);
    expect(result.current.hasLocation).toBe(true);
    expect(result.current.status).toBe('active');
    expect(result.current.error).toBeNull();
  });

  it('normalises a stationary device to a null heading and speed', () => {
    const { result } = renderHook(() => useGeolocation());
    const onPosition = geolocation.getCurrentPosition.mock.calls[0][0];
    act(() => onPosition(makePosition({ heading: null, speed: null })));

    expect(result.current.gpsHeading).toBeNull();
    expect(result.current.speed).toBeNull();
  });

  it('exposes the GPS course while moving', () => {
    const { result } = renderHook(() => useGeolocation());
    const onPosition = geolocation.getCurrentPosition.mock.calls[0][0];
    act(() => onPosition(makePosition({ heading: 137.5, speed: 1.4 })));

    expect(result.current.gpsHeading).toBeCloseTo(137.5, 5);
    expect(result.current.speed).toBeCloseTo(1.4, 5);
  });

  it('surfaces the error code instead of failing silently', () => {
    const { result } = renderHook(() => useGeolocation());
    const onError = geolocation.getCurrentPosition.mock.calls[0][1];
    // 1 = PERMISSION_DENIED
    act(() => onError({ code: 1 }));

    expect(result.current.error).toBe(1);
    expect(result.current.status).toBe('error');
    expect(result.current.hasLocation).toBe(false);
  });

  it('ignores a transient watch error once a fix is on screen', () => {
    const { result } = renderHook(() => useGeolocation({ watch: true }));
    const onPosition = geolocation.watchPosition.mock.calls[0][0];
    const onError = geolocation.watchPosition.mock.calls[0][1];
    act(() => onPosition(makePosition()));

    // 3 = TIMEOUT, routine in the field: the watch keeps trying and the last
    // position stays valid, so the control must not turn red and re-toast.
    act(() => onError({ code: 3 }));

    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('active');
    expect(result.current.location).toEqual({ lat: 45.1, lng: 5.7 });
  });

  it('still reports a denied permission after a fix', () => {
    const { result } = renderHook(() => useGeolocation({ watch: true }));
    const onPosition = geolocation.watchPosition.mock.calls[0][0];
    const onError = geolocation.watchPosition.mock.calls[0][1];
    act(() => onPosition(makePosition()));
    act(() => onError({ code: 1 }));

    expect(result.current.error).toBe(1);
    expect(result.current.status).toBe('error');
  });

  it('re-subscribes the watch on returning to the foreground', () => {
    const { result } = renderHook(() => useGeolocation({ watch: true }));
    const onPosition = geolocation.watchPosition.mock.calls[0][0];
    act(() => onPosition(makePosition()));

    // A locked screen suspends — and sometimes silently drops — the watch,
    // while the watchId stays valid so nothing ever re-arms it.
    goToBackgroundAndBack();

    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
    expect(geolocation.watchPosition).toHaveBeenCalledTimes(2);
    // Re-subscribing must not blank the dot while the new watch acquires.
    expect(result.current.hasLocation).toBe(true);
    expect(result.current.location).toEqual({ lat: 45.1, lng: 5.7 });
  });

  it('leaves a one-shot fix alone on returning to the foreground', () => {
    renderHook(() => useGeolocation());
    goToBackgroundAndBack();
    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('clears a stale error when re-enabled so the next session starts fresh', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useGeolocation({ watch: true, enabled }),
      { initialProps: { enabled: true } }
    );
    const onError = geolocation.watchPosition.mock.calls[0][1];
    act(() => onError({ code: 1 }));
    expect(result.current.error).toBe(1);

    // Off → on cycle: the retry must not inherit the previous denial.
    rerender({ enabled: false });
    rerender({ enabled: true });

    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('locating');
  });

  it('drops the previous fix on re-enable so follow doesn’t snap to a stale position', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useGeolocation({ watch: true, enabled }),
      { initialProps: { enabled: true } }
    );
    const onPosition = geolocation.watchPosition.mock.calls[0][0];
    act(() => onPosition(makePosition()));
    expect(result.current.hasLocation).toBe(true);

    rerender({ enabled: false });
    rerender({ enabled: true });

    expect(result.current.hasLocation).toBe(false);
  });
});
