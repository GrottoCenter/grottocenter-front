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
  });

  it('requests a high-accuracy fix with a finite timeout by default', () => {
    renderHook(() => useGeolocation());
    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    const options = geolocation.getCurrentPosition.mock.calls[0][2];
    expect(options).toEqual({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000
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
});
