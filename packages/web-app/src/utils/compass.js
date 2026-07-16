// Pure compass/rotation math shared by the compass control and the device
// orientation hook. No React, no DOM — easy to unit test.

// Normalize an angle to [0, 360).
export const normalizeDeg = deg => ((deg % 360) + 360) % 360;

// leaflet-rotate's bearing is the clockwise angle applied to the map, so to make
// the direction the device faces point up the map turns by the opposite heading.
export const headingToBearing = heading => -heading;

// Shortest signed angular difference (in [-180, 180]) from `from` to `to`.
// Accumulate with this to keep a continuous rotation, so a needle never spins
// the long way around when the heading crosses the 0°/360° boundary.
export const shortestAngleDelta = (from, to) =>
  ((((to - from) % 360) + 540) % 360) - 180;

// Derive a compass heading (0 = North, clockwise) from a device orientation
// event, corrected for the current screen rotation.
// - iOS exposes webkitCompassHeading, already screen-relative and clockwise.
// - Elsewhere we use the absolute alpha angle (counter-clockwise, so 360 - alpha)
//   and add the screen angle. `absolute === false` means a relative-only sensor
//   (no true compass) → unusable.
export const computeHeading = (event, screenAngle = 0) => {
  if (typeof event.webkitCompassHeading === 'number') {
    return normalizeDeg(event.webkitCompassHeading);
  }
  if (typeof event.alpha === 'number' && event.absolute !== false) {
    return normalizeDeg(360 - event.alpha + screenAngle);
  }
  return null;
};
