/**
 * Utility functions for polygon geometry analysis.
 *
 * Coordinates are expected as [lat, lng] arrays (Leaflet convention).
 * d3-polygon is axis-agnostic so the order doesn't matter for
 * area / perimeter calculations.
 */

import { polygonArea, polygonLength } from 'd3-polygon';

/**
 * Detect whether a polygon is a degenerate "needle" shape.
 *
 * Uses the isoperimetric ratio: area / perimeter². A circle scores
 * ~0.0796, a square ~0.0625, and needles/slivers approach 0.
 *
 * @param {Array<number[]>} coords - Array of [lat, lng] coordinate pairs
 * @param {number} [threshold=0.0001] - Ratio below which a polygon is
 *   considered a needle
 * @returns {boolean} True if the polygon is degenerate
 */
export const isNeedlePolygon = (coords, threshold = 0.0001) => {
  if (coords.length <= 3) return true;

  const area = Math.abs(polygonArea(coords));
  const perimeter = polygonLength(coords);

  if (perimeter === 0) return true;

  return area / (perimeter * perimeter) < threshold;
};
