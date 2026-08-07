import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useGeolocationPermission from './useGeolocationPermission';

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

// Above this radius (m) a fix is a cell/wifi answer, not GPS. The platform
// serves one within a second while the GPS is still cold, so it is a perfectly
// normal *first* response — but it does not prove the provider is doing its
// job, and a watch that only ever returns those is still acquiring. Rebuilding
// on the strength of one restarts the GPS acquisition from scratch every
// DEAD_AFTER_MS, so the fix can never converge: exactly the huge accuracy
// circle that never shrinks. Poking such a watch is right; rebuilding is not.
const PRECISE_ACCURACY_M = 100;

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
//
// `location` is null until a fix lands. The hook used to hand out defaultCoord
// instead, which reads as a real position: a consumer forgetting to check
// hasLocation would silently place the user on null island (0, 0) rather than
// fail. Callers that want a fallback view now spell it out themselves.
const useGeolocation = ({
  watch = false,
  enabled = true,
  enableHighAccuracy = false
} = {}) => {
  // The whole fix in one state: coordinates, accuracy, course and speed always
  // arrive together, from a single callback, and are only ever read together.
  const [fix, setFix] = useState(null);
  // GeolocationPositionError code: 1 denied, 2 unavailable, 3 timeout — or null.
  const [error, setError] = useState(null);
  // Bumped to re-subscribe: on every return to the foreground, and by the
  // watchdog when a watch is judged dead (see below).
  const [resumeTick, setResumeTick] = useState(0);

  // Read by the error callback, which must know whether a fix is already on
  // screen without re-subscribing the watch on every position update.
  const hasLocationRef = useRef(false);
  // When the last fix landed, for the watchdog. Re-armed on every subscription
  // so a freshly (re)started watch gets its full grace period to acquire.
  const lastFixAtRef = useRef(0);
  // Whether the provider has ever proved it can deliver a usable fix, i.e. one
  // good enough to place a caver on a map (see PRECISE_ACCURACY_M). Gates the
  // rebuild, never the poke.
  const hasPreciseFixRef = useRef(false);

  // Whether touching the geolocation API on our own initiative is off limits —
  // only a user gesture may do it from here on.
  //
  // 'prompt' is the dangerous one: re-subscribing is a clearWatch + a fresh
  // watchPosition, which a browser reads as "the site stopped using location,
  // then asked again", and a one-time grant (Chrome's default answer) is
  // consumed exactly there. Every rebuild then raises a new dialog, which is how
  // a stalled GPS became a prompt every 30s in the field. In 'denied' nothing
  // can succeed anyway. 'unknown' stays permissive on purpose: a browser that
  // cannot tell us (see useGeolocationPermission) keeps today's behaviour rather
  // than losing the stall recovery these retries exist for.
  const permission = useGeolocationPermission();
  const needsUserGesture = permission === 'prompt' || permission === 'denied';

  // Both effects below take the same options, and neither should re-run unless
  // they actually change — hence one memoised object rather than three loose
  // dependencies. `timeout` and `maximumAge` are derived, never passed in: they
  // have exactly one sensible value per mode and no caller has a say.
  const options = useMemo(
    () => ({
      enableHighAccuracy,
      // A one-shot must not hang forever: a finite timeout turns a denied or
      // unreachable sensor into an error the consumer can report. A watch is
      // the opposite — its contract is "tell me when you know", and the timeout
      // applies to EVERY acquisition, so a finite one manufactures TIMEOUT
      // errors out of ordinary field conditions (a cold GPS fix under canopy
      // takes 30-60s) and leaves tracking looking broken while it is simply
      // still searching.
      timeout: watch ? NO_TIMEOUT : 10000,
      // Navigation wants the freshest fix the device has; only a one-shot
      // "where am I" can afford to reuse a recent cached one.
      maximumAge: watch ? 0 : 10000
    }),
    [watch, enableHighAccuracy]
  );

  // Hoisted out of the subscription effect: the watchdog's one-shot poke feeds
  // its result back through the very same handler, so a revived provider lands
  // a position exactly as the watch would have.
  const onPosition = useCallback(position => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;
    lastFixAtRef.current = Date.now();
    hasLocationRef.current = true;
    if (Number.isFinite(accuracy) && accuracy <= PRECISE_ACCURACY_M) {
      hasPreciseFixRef.current = true;
    }
    setFix({
      // Nested so its reference is tied to the fix rather than to the render:
      // consumers follow `location` alone and recentre the map on every change
      // of it, so rebuilding it per render would recentre forever.
      location: { lat: latitude, lng: longitude },
      accuracy,
      // heading / speed are null (or NaN) while the device is stationary —
      // normalise both to a finite number or null. They give a fallback
      // heading source when the device has no magnetometer.
      gpsHeading: Number.isFinite(heading) ? heading : null,
      speed: Number.isFinite(speed) ? speed : null
    });
    setError(null);
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
  }, []);

  // Fresh session: clear a stale error from the previous run so the consumer's
  // "notify once per error code" logic re-arms and the button doesn't flash
  // red before the first fix (or first fresh error) comes in. Also drop the
  // previous fix so a follow consumer doesn't briefly recentre on the old
  // position (and its spinner shows) until the first fresh fix arrives.
  //
  // Deliberately kept out of the subscription effect below: a resume only
  // re-subscribes, and must not blank the position already being displayed.
  //
  // Depends on `enabled` alone — NOT on `options` — because an
  // enableHighAccuracy toggle from a re-rendering parent must not blank the
  // position on screen. The subscription effect below handles the options
  // change on its own by re-subscribing the watch.
  useEffect(() => {
    if (!enabled) return;
    setError(null);
    setFix(null);
    hasLocationRef.current = false;
    hasPreciseFixRef.current = false;
  }, [enabled]);

  // Screen off, phone back in a pocket, tab backgrounded: browsers suspend an
  // active watch and may drop it for good, yet the watchId stays valid so
  // nothing ever re-arms it — from then on tracking looks frozen. Re-subscribe
  // on returning to the foreground.
  useEffect(() => {
    if (!enabled || !watch || needsUserGesture) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      // A watch that was delivering moments ago is almost certainly still
      // alive, and visibilitychange fires for a two-second glance at another
      // tab as readily as for a night in a pocket. Re-subscribing on all of
      // them meant a full teardown/rebuild on EVERY screen wake — constant in
      // field navigation, and one dialog each time on a one-time grant. The
      // watchdog below still catches the watches that really are dead, at the
      // cost of a few seconds.
      if (Date.now() - lastFixAtRef.current < STALE_AFTER_MS) return;
      setResumeTick(n => n + 1);
    };
    // A bfcache restore resurrects the page — and its dead watch — without
    // necessarily going through a usable visibilitychange on iOS Safari.
    // Gated on `persisted` so ordinary navigations don't churn the provider;
    // and unlike above no staleness check, because `persisted` is proof in
    // itself that the page was frozen and the watch went with it.
    //
    // The price is a needless rebuild when the user leaves and comes back
    // within STALE_AFTER_MS — worth paying: a bfcache restore is a rare event
    // (it takes a real navigation away and back), whereas the screen wakes the
    // staleness check guards against happen constantly in the field. One
    // re-subscribe costs far less than the frozen dot the alternative leaves.
    const onPageShow = event => {
      if (event.persisted) setResumeTick(n => n + 1);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [enabled, watch, needsUserGesture]);

  // Liveness watchdog — the foreground counterpart of the resume handler above,
  // and the only thing that can unfreeze a watch without the user leaving the
  // app. See the constants at the top of the file for the strategy.
  useEffect(() => {
    // needsUserGesture: no fix can reach us without a grant, so neither the poke
    // nor the rebuild can achieve anything here except raise another dialog —
    // the loop reported from the field. Stay entirely quiet; the permission's
    // own 'change' event brings us back the moment the user answers.
    if (!enabled || !watch || !navigator.geolocation || needsUserGesture) {
      return undefined;
    }
    const id = setInterval(() => {
      // Hidden page: the watch is *supposed* to be quiet, so every age here is
      // a false positive. Rebuilding a watch nothing can feed would only burn a
      // teardown, and the resume handler above already covers the way back.
      if (document.visibilityState !== 'visible') return;
      const age = Date.now() - lastFixAtRef.current;
      if (age < STALE_AFTER_MS) return;
      // Rebuilding is only ever right for a watch that HAS delivered a usable
      // fix and then went quiet. Until then — no fix at all, or only coarse
      // ones — silence is the normal shape of a cold GPS acquisition (30-60s
      // under canopy, the very case NO_TIMEOUT exists for), and tearing the
      // watch down would restart that acquisition from scratch, forever. Keep
      // poking instead: a poke can only help.
      if (age >= DEAD_AFTER_MS && hasPreciseFixRef.current) {
        // Re-arm the clock before restarting, so the rebuilt watch is judged on
        // its own acquisition time instead of being torn down on the next tick.
        lastFixAtRef.current = Date.now();
        setResumeTick(n => n + 1);
        return;
      }
      // Failures are swallowed on purpose: the watch's own handler stays the
      // single source of truth for what the consumer sees, and a poke that
      // fails only says "no fresher fix" — the state we are already in.
      //
      // 10 s timeout matches the one-shot: at WATCHDOG_INTERVAL_MS = 5 s a
      // 15 s timeout would let three pokes overlap in flight, wasted work
      // that also burns battery on the GPS chip.
      navigator.geolocation.getCurrentPosition(onPosition, () => {}, {
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: 10000,
        maximumAge: 0
      });
    }, WATCHDOG_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, watch, options, onPosition, needsUserGesture]);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return undefined;

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
  }, [enabled, watch, options, resumeTick, onPosition, onError]);

  // Memoised so the whole result keeps a stable identity between renders where
  // nothing observable changed — consumers spread it into a context value.
  return useMemo(
    () => ({
      location: fix?.location ?? null,
      hasLocation: fix !== null,
      accuracy: fix?.accuracy ?? null,
      gpsHeading: fix?.gpsHeading ?? null,
      speed: fix?.speed ?? null,
      error
    }),
    [fix, error]
  );
};

export default useGeolocation;
