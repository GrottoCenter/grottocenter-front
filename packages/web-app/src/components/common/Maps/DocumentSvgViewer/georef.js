// Affine georeferencing from 3 control points.
//
// Points are stored in a "frame" coordinate system defined by the SVG's 3
// control points (see collectControlPoints in SvgTileLayer.js), NOT in raw SVG
// viewBox coordinates. The frame is the affine basis:
//   control-1 -> frame (0, 0)   (origin)
//   control-2 -> frame (1, 0)   (u axis)
//   control-3 -> frame (0, 1)   (v axis)
// A point at frame (u, v) therefore sits at
//   svg = P1 + u * (P2 - P1) + v * (P3 - P1)
// Because the control points are part of the drawing, this stays correct across
// any affine change of the SVG (translation, rotation, uniform/non-uniform
// scale, shear): re-place the 3 control points and every point follows.

// Builds frame (u, v) -> SVG [x, y] from control points [P1, P2, P3].
export const makeFrameToSvg = controlPoints => {
  const [p1, p2, p3] = controlPoints;
  const ux = p2[0] - p1[0];
  const uy = p2[1] - p1[1];
  const vx = p3[0] - p1[0];
  const vy = p3[1] - p1[1];
  return ([u, v]) => [p1[0] + u * ux + v * vx, p1[1] + u * uy + v * vy];
};

// Inverse: SVG [x, y] -> frame (u, v). Used by the future click-to-place UI to
// turn a click on the rendered map into stored point coordinates. Returns null
// if the control points are degenerate (collinear -> non-invertible basis).
export const makeSvgToFrame = controlPoints => {
  const [p1, p2, p3] = controlPoints;
  const ux = p2[0] - p1[0];
  const uy = p2[1] - p1[1];
  const vx = p3[0] - p1[0];
  const vy = p3[1] - p1[1];
  const det = ux * vy - uy * vx;
  if (Math.abs(det) < 1e-9) return null;
  return ([x, y]) => {
    const dx = x - p1[0];
    const dy = y - p1[1];
    return [(dx * vy - dy * vx) / det, (ux * dy - uy * dx) / det];
  };
};
