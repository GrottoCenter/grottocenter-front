import { useRef } from 'react';
import { shortestAngleDelta } from '../utils/compass';

// Turn a wrapped angle series (any [0, 360) value, e.g. a heading-relative
// bearing) into a continuous, unwrapped one fit for an animated CSS `rotate()`.
//
// CSS interpolates rotate() numerically, so an element with a transform
// transition fed a wrapped value sweeps the long way round every time the series
// crosses its 0/360 boundary: 359deg → 2deg animates *down* through 180deg.
// Accumulating the shortest signed delta keeps the value continuous, so the
// rotation always takes the short path — the same trick the compass needle uses
// for the map bearing.
//
// The first angle passes through unchanged — there is nothing to be continuous
// with yet, and seeding the accumulator at 0 instead would report 359° as -1°.
// Returns null while `angle` is null, keeping the accumulator where it was so a
// heading that drops out and comes back doesn't make the element spin.
//
// The ref is written during render on purpose: re-applying the same target
// yields a zero delta, so a double-invoked (StrictMode) or discarded render
// leaves the same value.
const useContinuousAngle = angle => {
  const continuousRef = useRef(null);
  if (angle == null) return null;
  continuousRef.current =
    continuousRef.current == null
      ? angle
      : continuousRef.current + shortestAngleDelta(continuousRef.current, angle);
  return continuousRef.current;
};

export default useContinuousAngle;
