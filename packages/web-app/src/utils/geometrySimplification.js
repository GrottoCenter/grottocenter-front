import simplify from 'simplify-js';
import { countMultiPolygonVertices } from '@/helpers/vertexCount';

export const INFO_VERTICES = 500;
const PROBE_SAMPLES = 30;
const USEFUL_RANGE_THRESHOLD = 0.95;
const SLIDER_STEPS = 200;

export const simplifyPolygon = (multiPolygon, tolerance) => ({
  type: 'MultiPolygon',
  coordinates: multiPolygon.coordinates.map(polygon =>
    polygon.map(ring => {
      const points = ring.map(([x, y]) => ({ x, y }));
      return simplify(points, tolerance, true).map(({ x, y }) => [x, y]);
    })
  )
});

export const analyzeSimplificationCurve = (multiPolygon, rawVertexCount) => {
  const fallback = {
    maxTolerance: 0.001,
    step: 0.00001,
    minAchievableCount: rawVertexCount
  };
  if (rawVertexCount <= 3) return fallback;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const polygon of multiPolygon.coordinates) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const diagonal = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
  const upperBound = diagonal / 2;
  const lowerBound = diagonal / 100000;
  if (upperBound <= 0 || lowerBound <= 0) return fallback;

  // Probe logarithmically: degrees vary widely between imported geometries.
  const logLower = Math.log10(lowerBound);
  const logUpper = Math.log10(upperBound);
  const probes = [];
  for (let i = 0; i <= PROBE_SAMPLES; i += 1) {
    const tolerance =
      10 ** (logLower + (i / PROBE_SAMPLES) * (logUpper - logLower));
    const simplified = simplifyPolygon(multiPolygon, tolerance);
    probes.push({
      tolerance,
      count: countMultiPolygonVertices(simplified.coordinates)
    });
  }
  const minCount = Math.min(...probes.map(probe => probe.count));
  const totalReduction = rawVertexCount - minCount;
  if (totalReduction <= 0) {
    return {
      maxTolerance: lowerBound * 10,
      step: lowerBound,
      minAchievableCount: minCount
    };
  }
  const thresholdCount =
    rawVertexCount - totalReduction * USEFUL_RANGE_THRESHOLD;
  const targetCount =
    minCount < INFO_VERTICES
      ? Math.min(thresholdCount, INFO_VERTICES)
      : thresholdCount;
  const usefulMax =
    probes.find(probe => probe.count <= targetCount)?.tolerance ??
    probes[probes.length - 1].tolerance;
  const maxTolerance = usefulMax * 1.1;
  return {
    maxTolerance,
    step: maxTolerance / SLIDER_STEPS,
    minAchievableCount: minCount
  };
};
