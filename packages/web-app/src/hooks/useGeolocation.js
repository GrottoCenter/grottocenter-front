import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultCoord } from '../conf/config';

// The Geolocation spec's own default for PositionOptions.timeout (~49 days, i.e.
// no practical limit). Spelled out rather than passed as Infinity: `timeout` is a
// WebIDL unsigned long, and an engine that doesn't apply the spec's [Clamp] would
// coerce Infinity to 0 — a timeout firing on every single acquisition.
const NO_TIMEOUT = 0xffffffff;

// A watch is a subscription, not a delivery guarantee. Both mobile platforms
// leave watches that simply stop feeding us while the watchId stays perfectly
// valid, so nothing ever re-arms them; and since a watch runs with NO_TIMEOUT
// (see below) the platform never reports it either. A frozen dot is then
// indistinguishable from one still searching, and the only recovery left is for
// the user to leave the app and come back — which is exactly what a detour
// through a native maps app does, and why the position unfreezes right after.
//
// So supervise the watch ourselves, on the age of the last fix:
//  - stale → a one-shot poke. Asking for a position outright is what spins the
//    GPS engine back up (on Android it raises the fused provider's priority),
//    and the running watch gets fed again as a side effect.
//  - dead  → the poke didn't bring it back; rebuild the watch from scratch.
const WATCHDOG_INTERVAL_MS = 5000;
const STALE_AFTER_MS = 15000;
const DEAD_AFTER_MS = 30000;

// One-shot geolocation by default. Pass { watch: true } to keep tracking the
// position (watchPosition) — used by the location marker and the waypoint
// navigation to update the live distance and the as-the-crow-flies line as the
// user moves.
//
// - enabled=false keeps the hook dormant (no permission prompt, no tracking)
//   until the consumer flips it on — used by the location control's lazy
//   activation, so we never prompt for geolocation before the user asks for it.
// - High accuracy is off by default: coarse network-based fixes are fine for
//   "center the map on where I am" style consumers, and much faster/cheaper on
//   battery. Field-navigation consumers (LocationControl, WaypointNavigation)
//   opt in explicitly via the shared MapLocationProvider.
const useGeolocation = ({
  watch = false,
  enabled = true,
  enableHighAccuracy = false,
  // A one-shot must not hang forever: a finite timeout turns a denied or
  // unreachable sensor into an error the consumer can report. A watch is the
  // opposite — its contract is "tell me when you know", and the timeout applies
  // to EVERY acquisition, so a finite one manufactures TIMEOUT errors out of
  // ordinary field conditions (a cold GPS fix under canopy takes 30-60s) and
  // leaves tracking looking broken while it is simply still searching.
  timeout = watch ? NO_TIMEOUT : 10000,
  // Navigation wants the freshest fix the device has; only a one-shot
  // "where am I" can afford to reuse a recent cached one.
  maximumAge = watch ? 0 : 10000
} = {}) => {
  const [location, setLocation] = useState(defaultCoord);
  const [hasLocation, setHasLocation] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  // GPS-derived course (deg) and speed (m/s). Only defined while moving, so they
  // are a fallback heading source when the device has no magnetometer.
  const [gpsHeading, setGpsHeading] = useState(null);
  const [speed, setSpeed] = useState(null);
  // GeolocationPositionError code: 1 denied, 2 unavailable, 3 timeout — or null.
  const [error, setError] = useState(null);
  // 'idle' | 'locating' | 'active' | 'error'
  const [status, setStatus] = useState('idle');
  // Bumped on every return to the foreground to re-subscribe (see below).
  const [resumeTick, setResumeTick] = useState(0);

  // Read by the error callback, which must know whether a fix is already on
  // screen without re-subscribing the watch on every position update.
  const hasLocationRef = useRef(false);
  // When the last fix landed, for the watchdog. Re-armed on every subscription
  // so a freshly (re)started watch gets its full grace period to acquire.
  const lastFixAtRef = useRef(0);

  // Hoisted out of the subscription effect: the watchdog's one-shot poke feeds
  // its result back through the very same handler, so a revived provider lands
  // a position exactly as the watch would have.
  const onPosition = useCallback(position => {
    setLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude
    });
    setAccuracy(position.coords.accuracy);
    // coords.heading / coords.speed are null (or NaN) while the device is
    // stationary — normalise both to a finite number or null.
    setGpsHeading(
      Number.isFinite(position.coords.heading) ? position.coords.heading : null
    );
    setSpeed(
      Number.isFinite(position.coords.speed) ? position.coords.speed : null
    );
    lastFixAtRef.current = Date.now();
    hasLocationRef.current = true;
    setHasLocation(true);
    setError(null);
    setStatus('active');
  }, []);

  const onError = useCallback(err => {
    // Once a fix is on screen, a TIMEOUT or a transient POSITION_UNAVAILABLE
    // means "no fresher fix right now", not "tracking failed": the watch keeps
    // trying and the last position stays valid. Reporting them turned the
    // control red and re-toasted on every GPS blink in the field. Only a denied
    // permission is terminal, and errors before the first fix still surface so
    // activation is never a silent no-op.
    if (err.code !== 1 && hasLocationRef.current) return;
    setError(err.code);
    setStatus('error');
  }, []);

  // Fresh session: clear a stale error from the previous run so the consumer's
  // "notify once per error code" logic re-arms and the button doesn't flash
  // red before the first fix (or first fresh error) comes in. Also drop the
  // previous fix so a follow consumer doesn't briefly recentre on the old
  // position (and its spinner shows) until the first fresh fix arrives.
  //
  // Deliberately kept out of the subscription effect below: a resume only
  // re-subscribes, and must not blank the position already being displayed.
  useEffect(() => {
    if (!enabled) return;
    setError(null);
    setStatus('locating');
    setHasLocation(false);
    hasLocationRef.current = false;
  }, [watch, enabled, enableHighAccuracy, timeout, maximumAge]);

  // Screen off, phone back in a pocket, tab backgrounded: browsers suspend an
  // active watch and may drop it for good, yet the watchId stays valid so
  // nothing ever re-arms it — from then on tracking looks frozen. Re-subscribe
  // on every return to the foreground.
  useEffect(() => {
    if (!enabled || !watch) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') setResumeTick(n => n + 1);
    };
    // A bfcache restore resurrects the page — and its dead watch — without
    // necessarily going through a usable visibilitychange on iOS Safari.
    // Gated on `persisted` so ordinary navigations don't churn the provider.
    const onPageShow = event => {
      if (event.persisted) setResumeTick(n => n + 1);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [enabled, watch]);

  // Liveness watchdog — the foreground counterpart of the resume handler above,
  // and the only thing that can unfreeze a watch without the user leaving the
  // app. See the constants at the top of the file for the strategy.
  useEffect(() => {
    if (!enabled || !watch || !navigator.geolocation) return undefined;
    const id = setInterval(() => {
      // Hidden page: the watch is *supposed* to be quiet, so every age here is
      // a false positive. Rebuilding a watch nothing can feed would only burn a
      // teardown, and the resume handler above already covers the way back.
      if (document.visibilityState !== 'visible') return;
      const age = Date.now() - lastFixAtRef.current;
      if (age < STALE_AFTER_MS) return;
      // Rebuilding is only ever right for a watch that HAS delivered and then
      // went quiet. Before the first fix, silence is the normal shape of a cold
      // GPS acquisition — 30-60s under canopy, the very case NO_TIMEOUT exists
      // for — and tearing the watch down would restart that acquisition from
      // scratch, indefinitely. Keep poking instead: a poke can only help.
      if (age >= DEAD_AFTER_MS && hasLocationRef.current) {
        // Re-arm the clock before restarting, so the rebuilt watch is judged on
        // its own acquisition time instead of being torn down on the next tick.
        lastFixAtRef.current = Date.now();
        setResumeTick(n => n + 1);
        return;
      }
      // Failures are swallowed on purpose: the watch's own handler stays the
      // single source of truth for what the consumer sees, and a poke that
      // fails only says "no fresher fix" — the state we are already in.
      navigator.geolocation.getCurrentPosition(onPosition, () => {}, {
        enableHighAccuracy,
        timeout: STALE_AFTER_MS,
        maximumAge: 0
      });
    }, WATCHDOG_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, watch, enableHighAccuracy, onPosition]);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return undefined;

    const options = { enableHighAccuracy, timeout, maximumAge };

    if (!watch) {
      navigator.geolocation.getCurrentPosition(onPosition, onError, options);
      return undefined;
    }

    lastFixAtRef.current = Date.now();
    const watchId = navigator.geolocation.watchPosition(
      onPosition,
      onError,
      options
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [
    watch,
    enabled,
    enableHighAccuracy,
    timeout,
    maximumAge,
    resumeTick,
    onPosition,
    onError
  ]);

  return { location, hasLocation, accuracy, gpsHeading, speed, error, status };
};

export default useGeolocation;
