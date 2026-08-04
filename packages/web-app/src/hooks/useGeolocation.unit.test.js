import { renderHook, act } from '@testing-library/react';
import useGeolocation from './useGeolocation';

// The real hook resolves asynchronously and is covered by its own suite; here we
// only need to drive the state the watch reacts to, synchronously.
let permissionState = 'granted';
vi.mock('./useGeolocationPermission', () => ({
  default: () => permissionState
}));

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
    permissionState = 'granted';
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

  it('exposes no position at all until a fix lands', () => {
    // A sentinel position would read as a real one, and a consumer forgetting
    // to check hasLocation would silently place the user on null island (0, 0)
    // instead of failing.
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.location).toBeNull();
    expect(result.current.accuracy).toBeNull();
    expect(result.current.hasLocation).toBe(false);
  });

  it('exposes the position and its accuracy once a fix lands', () => {
    const { result } = renderHook(() => useGeolocation());
    const onPosition = geolocation.getCurrentPosition.mock.calls[0][0];
    act(() => onPosition(makePosition()));

    expect(result.current.location).toEqual({ lat: 45.1, lng: 5.7 });
    expect(result.current.accuracy).toBe(12);
    expect(result.current.hasLocation).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('keeps the location reference stable across unrelated renders', () => {
    const { result, rerender } = renderHook(() => useGeolocation());
    act(() => geolocation.getCurrentPosition.mock.calls[0][0](makePosition()));

    const first = result.current.location;
    rerender();

    // Consumers recentre the map on every change of `location`; a fresh object
    // per render would make that fire forever.
    expect(result.current.location).toBe(first);
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
    expect(result.current.location).toEqual({ lat: 45.1, lng: 5.7 });
  });

  it('still reports a denied permission after a fix', () => {
    const { result } = renderHook(() => useGeolocation({ watch: true }));
    const onPosition = geolocation.watchPosition.mock.calls[0][0];
    const onError = geolocation.watchPosition.mock.calls[0][1];
    act(() => onPosition(makePosition()));
    act(() => onError({ code: 1 }));

    expect(result.current.error).toBe(1);
  });

  it('re-subscribes the watch on returning to the foreground', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useGeolocation({ watch: true }));
      const onPosition = geolocation.watchPosition.mock.calls[0][0];
      act(() => onPosition(makePosition()));
      // Long enough away that the watch is genuinely suspect.
      act(() => vi.advanceTimersByTime(16000));

      // A locked screen suspends — and sometimes silently drops — the watch,
      // while the watchId stays valid so nothing ever re-arms it.
      goToBackgroundAndBack();

      expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(2);
      // Re-subscribing must not blank the dot while the new watch acquires.
      expect(result.current.hasLocation).toBe(true);
      expect(result.current.location).toEqual({ lat: 45.1, lng: 5.7 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves a watch that is still delivering alone on returning to the foreground', () => {
    renderHook(() => useGeolocation({ watch: true }));
    const onPosition = geolocation.watchPosition.mock.calls[0][0];
    act(() => onPosition(makePosition()));

    // visibilitychange fires for a two-second glance at another tab as readily
    // as for a night in a pocket. Tearing the watch down and rebuilding it here
    // is what a browser reads as "stopped using location, then asked again" —
    // one permission dialog per screen wake on a one-time grant.
    goToBackgroundAndBack();

    expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
    expect(geolocation.clearWatch).not.toHaveBeenCalled();
  });

  it('never re-subscribes while a permission dialog could appear', () => {
    vi.useFakeTimers();
    try {
      permissionState = 'prompt';
      renderHook(() => useGeolocation({ watch: true }));
      const onPosition = geolocation.watchPosition.mock.calls[0][0];
      act(() => onPosition(makePosition()));
      act(() => vi.advanceTimersByTime(16000));

      goToBackgroundAndBack();

      expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
      expect(geolocation.clearWatch).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves a one-shot fix alone on returning to the foreground', () => {
    renderHook(() => useGeolocation());
    goToBackgroundAndBack();
    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('re-subscribes the watch when the page is restored from bfcache', () => {
    renderHook(() => useGeolocation({ watch: true }));
    act(() =>
      window.dispatchEvent(
        new PageTransitionEvent('pageshow', {
          persisted: true
        })
      )
    );
    expect(geolocation.watchPosition).toHaveBeenCalledTimes(2);
  });

  it('ignores an ordinary pageshow, which carries a live watch', () => {
    renderHook(() => useGeolocation({ watch: true }));
    act(() =>
      window.dispatchEvent(
        new PageTransitionEvent('pageshow', {
          persisted: false
        })
      )
    );
    expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
  });

  describe('watchdog', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const deliverFix = () =>
      act(() => {
        const calls = geolocation.watchPosition.mock.calls;
        calls[calls.length - 1][0](makePosition());
      });

    it('stays out of the way while the watch keeps delivering', () => {
      renderHook(() => useGeolocation({ watch: true }));
      for (let i = 0; i < 6; i += 1) {
        act(() => vi.advanceTimersByTime(5000));
        deliverFix();
      }
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it('pokes the provider with a one-shot once the watch goes quiet', () => {
      renderHook(() =>
        useGeolocation({ watch: true, enableHighAccuracy: true })
      );
      deliverFix();

      act(() => vi.advanceTimersByTime(14000));
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();

      // Past 15s without a fix: ask for a position outright, which is what
      // spins the GPS engine back up and feeds the watch again.
      act(() => vi.advanceTimersByTime(5000));
      expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
      expect(geolocation.getCurrentPosition.mock.calls[0][2]).toEqual({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
      // A poke must never rebuild the watch — that is the next step up.
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it('lets a successful poke unfreeze the position and re-arm the clock', () => {
      const { result } = renderHook(() => useGeolocation({ watch: true }));
      deliverFix();
      act(() => vi.advanceTimersByTime(15000));

      act(() =>
        geolocation.getCurrentPosition.mock.calls[0][0](
          makePosition({ latitude: 45.9, longitude: 6.2 })
        )
      );
      expect(result.current.location).toEqual({ lat: 45.9, lng: 6.2 });

      // Fresh again: no escalation to a rebuild, and no second poke.
      act(() => vi.advanceTimersByTime(14000));
      expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it('rebuilds the watch when even the poke brings nothing back', () => {
      const { result } = renderHook(() => useGeolocation({ watch: true }));
      deliverFix();

      act(() => vi.advanceTimersByTime(31000));

      expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(2);
      // Rebuilding must not blank the dot while the new watch acquires.
      expect(result.current.hasLocation).toBe(true);

      // The rebuilt watch gets its own grace period rather than being torn
      // down again on the very next tick.
      act(() => vi.advanceTimersByTime(14000));
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(2);
    });

    it('supervises the first acquisition too, not just a watch that stalls later', () => {
      renderHook(() => useGeolocation({ watch: true }));
      // No fix ever delivered: the grace period runs from subscription.
      act(() => vi.advanceTimersByTime(16000));
      expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it('never rebuilds a watch that only ever returned coarse fixes', () => {
      renderHook(() =>
        useGeolocation({ watch: true, enableHighAccuracy: true })
      );
      // A 1.2km cell fix: a normal first answer while the GPS is still cold,
      // but no proof the provider works. Rebuilding here would restart the
      // acquisition every 30s and the circle would never shrink.
      act(() => {
        const calls = geolocation.watchPosition.mock.calls;
        calls[calls.length - 1][0](makePosition({ accuracy: 1200 }));
      });

      act(() => vi.advanceTimersByTime(120000));

      expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
      expect(geolocation.clearWatch).not.toHaveBeenCalled();
      expect(geolocation.getCurrentPosition.mock.calls.length).toBeGreaterThan(
        1
      );
    });

    it('rebuilds once the provider has proved it can deliver a GPS fix', () => {
      renderHook(() =>
        useGeolocation({ watch: true, enableHighAccuracy: true })
      );
      act(() => {
        const calls = geolocation.watchPosition.mock.calls;
        calls[calls.length - 1][0](makePosition({ accuracy: 1200 }));
        calls[calls.length - 1][0](makePosition({ accuracy: 8 }));
      });

      act(() => vi.advanceTimersByTime(31000));

      expect(geolocation.watchPosition).toHaveBeenCalledTimes(2);
    });

    it('never rebuilds a watch that has not delivered yet', () => {
      renderHook(() => useGeolocation({ watch: true }));

      // A cold GPS fix under canopy takes 30-60s. Silence here means "still
      // acquiring", and a rebuild would restart that acquisition for good.
      act(() => vi.advanceTimersByTime(120000));

      expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
      expect(geolocation.clearWatch).not.toHaveBeenCalled();
      // Poking is still right — it is what wakes a dozing provider.
      expect(geolocation.getCurrentPosition.mock.calls.length).toBeGreaterThan(
        1
      );
    });

    it('stays quiet while the page is hidden, where silence is expected', () => {
      renderHook(() => useGeolocation({ watch: true }));
      deliverFix();
      setVisibility('hidden');

      act(() => vi.advanceTimersByTime(60000));

      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it('leaves a one-shot consumer unsupervised', () => {
      renderHook(() => useGeolocation());
      act(() => vi.advanceTimersByTime(60000));
      expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it('stops supervising once tracking is disabled', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useGeolocation({ watch: true, enabled }),
        { initialProps: { enabled: true } }
      );
      rerender({ enabled: false });
      act(() => vi.advanceTimersByTime(60000));
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
    });

    it('goes silent while a permission dialog is pending or was dismissed', () => {
      permissionState = 'prompt';
      renderHook(() => useGeolocation({ watch: true, enableHighAccuracy: true }));
      act(() => {
        const calls = geolocation.watchPosition.mock.calls;
        calls[calls.length - 1][0](makePosition({ accuracy: 8 }));
      });

      act(() => vi.advanceTimersByTime(120000));

      // No fix can reach us without a grant, so poking and rebuilding can only
      // raise another dialog — the every-30s prompt loop reported from the
      // field. Both must stop dead until the permission lands.
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
      expect(geolocation.clearWatch).not.toHaveBeenCalled();
    });

    it('stays silent once the permission is denied outright', () => {
      permissionState = 'denied';
      renderHook(() => useGeolocation({ watch: true }));

      act(() => vi.advanceTimersByTime(120000));

      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });

    it('supervises as before on a browser that cannot report the permission', () => {
      // Safari < 16 and some WebViews: losing the stall recovery there would be
      // a worse trade than the dialog it guards against, so 'unknown' keeps the
      // watchdog running exactly as it always did.
      permissionState = 'unknown';
      renderHook(() => useGeolocation({ watch: true, enableHighAccuracy: true }));
      act(() => {
        const calls = geolocation.watchPosition.mock.calls;
        calls[calls.length - 1][0](makePosition({ accuracy: 8 }));
      });

      act(() => vi.advanceTimersByTime(31000));

      expect(geolocation.getCurrentPosition).toHaveBeenCalled();
      expect(geolocation.watchPosition).toHaveBeenCalledTimes(2);
    });

    it('resumes supervising as soon as the permission is granted', () => {
      permissionState = 'prompt';
      const { rerender } = renderHook(() =>
        useGeolocation({ watch: true, enableHighAccuracy: true })
      );
      act(() => vi.advanceTimersByTime(60000));
      expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();

      // What the PermissionStatus 'change' event does once the user answers.
      permissionState = 'granted';
      rerender();

      act(() => vi.advanceTimersByTime(16000));
      expect(geolocation.getCurrentPosition).toHaveBeenCalled();
    });
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
