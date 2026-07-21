import React, { useRef, useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Button,
  Slider,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { Upload } from '@mui/icons-material';
import simplify from 'simplify-js';
import shp from 'shpjs';
import {
  countMultiPolygonVertices
} from '../../../../helpers/vertexCount';
import { parseGeoJsonToMultiPolygon } from '../../../../helpers/geojsonParser';
import FileSelectorInput from '../../../common/FileSelectorInput';

const INITIAL_TOLERANCE = 0.0;
const DANGER_VERTICES = 2000;
const WARN_VERTICES = 1000;
const INFO_VERTICES = 500;

const ACCEPTED_EXTENSIONS = ['.geojson', '.json', '.zip'];
const ACCEPTED_MIME = '.geojson,.json,.zip';

// Simplify polygon using simplify-js library
const simplifyPolygon = (multiPolygon, toleranceValue) => ({
  type: 'MultiPolygon',
  coordinates: multiPolygon.coordinates.map(polygon =>
    polygon.map(ring => {
      const points = ring.map(coord => ({ x: coord[0], y: coord[1] }));
      const simplified = simplify(points, toleranceValue, true);
      return simplified.map(point => [point.x, point.y]);
    })
  )
});

/**
 * Number of sample points used to probe the simplification curve.
 * More samples = more accurate range detection, but slightly more
 * computation at file-load time. 30 is a good balance.
 */
const PROBE_SAMPLES = 30;

/**
 * The fraction of total vertex reduction that defines the "useful" range.
 * We set the slider max at the tolerance where 95% of vertices have been
 * removed — beyond that, further tolerance increases barely change anything.
 */
const USEFUL_RANGE_THRESHOLD = 0.95;

/**
 * Number of discrete steps the slider should have across its range.
 * This gives smooth dragging without excessive re-renders.
 */
const SLIDER_STEPS = 200;

/**
 * Analyze the simplification curve of a MultiPolygon by probing at
 * exponentially-spaced tolerance values. Returns { maxTolerance, step,
 * minAchievableCount } calibrated to the geometry's actual response to
 * simplification.
 *
 * minAchievableCount is the lowest vertex count reachable regardless of
 * tolerance — this is the irreducible floor imposed by the number of
 * polygons/rings (each ring needs at least 3 vertices).
 *
 * Strategy:
 * 1. Probe tolerance values on a log scale from a very small value up to
 *    a generous upper bound (derived from the geometry's bounding box).
 * 2. Record vertex count at each probe point.
 * 3. Find the tolerance at which USEFUL_RANGE_THRESHOLD of the total
 *    possible reduction has occurred — that becomes the slider max.
 * 4. Derive step from the useful range divided by SLIDER_STEPS.
 */
const analyzeSimplificationCurve = (multiPolygon, rawVertexCount) => {
  if (rawVertexCount <= 3) {
    return { maxTolerance: 0.001, step: 0.00001, minAchievableCount: rawVertexCount };
  }

  // Compute bounding box diagonal as an upper bound for tolerance.
  // simplify-js tolerance is in the same units as coordinates (degrees for
  // WGS84), so the bbox diagonal is a natural ceiling.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const polygon of multiPolygon.coordinates) {
    for (const ring of polygon) {
      for (const coord of ring) {
        if (coord[0] < minX) minX = coord[0];
        if (coord[0] > maxX) maxX = coord[0];
        if (coord[1] < minY) minY = coord[1];
        if (coord[1] > maxY) maxY = coord[1];
      }
    }
  }
  const diagonal = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);

  // Upper bound: half the diagonal is more than enough to collapse everything
  const upperBound = diagonal / 2;
  // Lower bound: a very small fraction of the diagonal
  const lowerBound = diagonal / 100000;

  if (upperBound <= 0 || lowerBound <= 0) {
    return { maxTolerance: 0.001, step: 0.00001, minAchievableCount: rawVertexCount };
  }

  // Probe on a log scale
  const logLower = Math.log10(lowerBound);
  const logUpper = Math.log10(upperBound);
  const probes = [];

  for (let i = 0; i <= PROBE_SAMPLES; i += 1) {
    const logT = logLower + (i / PROBE_SAMPLES) * (logUpper - logLower);
    const t = 10 ** logT;
    const simplified = simplifyPolygon(multiPolygon, t);
    const count = countMultiPolygonVertices(simplified.coordinates);
    probes.push({ tolerance: t, count });
  }

  // Find the minimum vertex count achievable (the floor)
  const minCount = Math.min(...probes.map(p => p.count));
  const totalReduction = rawVertexCount - minCount;

  if (totalReduction <= 0) {
    // Geometry can't be simplified (e.g., already minimal)
    return {
      maxTolerance: lowerBound * 10,
      step: lowerBound,
      minAchievableCount: minCount
    };
  }

  // Find the tolerance at which USEFUL_RANGE_THRESHOLD of reduction is reached
  const thresholdCount =
    rawVertexCount - totalReduction * USEFUL_RANGE_THRESHOLD;

  // Ensure the slider goes far enough to bring the count under INFO_VERTICES,
  // but only if the geometry can actually be reduced that far.
  const targetCount =
    minCount < INFO_VERTICES
      ? Math.min(thresholdCount, INFO_VERTICES)
      : thresholdCount;

  let usefulMax = probes[probes.length - 1].tolerance;
  for (const probe of probes) {
    if (probe.count <= targetCount) {
      usefulMax = probe.tolerance;
      break;
    }
  }

  // Add 10% headroom so the user can push slightly past the threshold
  const maxTolerance = usefulMax * 1.1;
  const step = maxTolerance / SLIDER_STEPS;

  return { maxTolerance, step, minAchievableCount: minCount };
};

const ShapefileImport = ({ onImport }) => {
  const { formatMessage } = useIntl();
  const cancelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [tolerance, setTolerance] = useState(INITIAL_TOLERANCE);
  const [rawData, setRawData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [parseError, setParseError] = useState(null);

  const rawVertexCount = useMemo(() => {
    if (!rawData) return 0;
    return countMultiPolygonVertices(rawData.coordinates);
  }, [rawData]);

  const [analyzing, setAnalyzing] = useState(false);
  const [sliderParams, setSliderParams] = useState({
    maxTolerance: 0.01,
    step: 0.0001,
    minAchievableCount: 0
  });

  useEffect(() => {
    if (!rawData) {
      setSliderParams({
        maxTolerance: 0.01,
        step: 0.0001,
        minAchievableCount: 0
      });
      setAnalyzing(false);
      return;
    }
    setAnalyzing(true);
    // Double rAF ensures React commits the analyzing=true render and the
    // browser paints before we block the main thread.
    const frameId = requestAnimationFrame(() => {
      const innerFrameId = requestAnimationFrame(() => {
        const result = analyzeSimplificationCurve(rawData, rawVertexCount);
        setSliderParams(result);
        setAnalyzing(false);
      });
      cancelRef.current = innerFrameId;
    });
    return () => {
      cancelAnimationFrame(frameId);
      if (cancelRef.current) cancelAnimationFrame(cancelRef.current);
    };
  }, [rawData, rawVertexCount]);

  const { maxTolerance, step, minAchievableCount } = sliderParams;

  const simplifiedData = useMemo(() => {
    if (!rawData) return null;
    return simplifyPolygon(rawData, tolerance);
  }, [rawData, tolerance]);

  const vertexCount = useMemo(() => {
    if (!simplifiedData) return 0;
    return countMultiPolygonVertices(simplifiedData.coordinates);
  }, [simplifiedData]);

  const getVertexWarning = () => {
    if (vertexCount > DANGER_VERTICES) {
      // If the floor is above DANGER, simplification alone can't fix it
      if (minAchievableCount > DANGER_VERTICES) {
        return {
          severity: 'error',
          message: formatMessage(
            {
              id: 'This file contains too many polygons to simplify below {count} vertices. Consider splitting or removing polygons before importing.'
            },
            { count: DANGER_VERTICES }
          )
        };
      }
      return {
        severity: 'error',
        message: formatMessage({
          id: 'Too many vertices. This will cause browser issues. Increase simplification.'
        })
      };
    }
    if (vertexCount > WARN_VERTICES) {
      if (minAchievableCount > WARN_VERTICES) {
        return {
          severity: 'warning',
          message: formatMessage(
            {
              id: 'This file has many polygons. Minimum achievable vertex count is {count}. Consider reducing the number of polygons.'
            },
            { count: minAchievableCount }
          )
        };
      }
      return {
        severity: 'warning',
        message: formatMessage({
          id: 'High vertex count may cause performance issues. Consider increasing simplification.'
        })
      };
    }
    if (vertexCount > INFO_VERTICES) {
      if (minAchievableCount > INFO_VERTICES) {
        return {
          severity: 'info',
          message: formatMessage(
            {
              id: 'This file has many polygons. Minimum achievable vertex count is {count}.'
            },
            { count: minAchievableCount }
          )
        };
      }
      return {
        severity: 'info',
        message: formatMessage({
          id: 'Moderate vertex count. May impact performance on older devices.'
        })
      };
    }
    return null;
  };

  const handleFilesAdd = async fileList => {
    const file = fileList[0];
    if (!file) return;

    setParseError(null);

    const name = file.name.toLowerCase();

    try {
      if (name.endsWith('.geojson') || name.endsWith('.json')) {
        const text = await file.text();
        const geojson = JSON.parse(text);
        const multiPolygon = parseGeoJsonToMultiPolygon(geojson);
        if (!multiPolygon) {
          setParseError(
            formatMessage({ id: 'No polygon geometries found in GeoJSON' })
          );
          return;
        }
        setFileName(file.name);
        setRawData(multiPolygon);
      } else if (name.endsWith('.zip')) {
        const arrayBuffer = await file.arrayBuffer();
        const geojson = await shp(arrayBuffer);
        const multiPolygon = parseGeoJsonToMultiPolygon(geojson);
        if (!multiPolygon) {
          setParseError(
            formatMessage({ id: 'No polygon geometries found in shapefile.' })
          );
          return;
        }
        setFileName(file.name);
        setRawData(multiPolygon);
      } else {
        setParseError(
          formatMessage({
            id: 'Please select a GeoJSON (.geojson) or Shapefile ZIP (.zip) file'
          })
        );
      }
    } catch (error) {
      console.error('File parsing error:', error);
      const errorMsg =
        typeof error === 'string'
          ? error
          : error?.message || error?.toString() || 'Unknown error';
      setParseError(
        `${formatMessage({ id: 'Failed to parse file' })}: ${errorMsg}`
      );
    }
  };

  const handleFileRemove = () => {
    setRawData(null);
    setFileName(null);
    setParseError(null);
    setTolerance(INITIAL_TOLERANCE);
  };

  const handleImport = () => {
    if (simplifiedData) {
      const data = simplifiedData;
      setOpen(false);
      setRawData(null);
      setFileName(null);
      setParseError(null);
      setTolerance(INITIAL_TOLERANCE);
      // Defer the heavy onImport so the dialog closes first
      requestAnimationFrame(() => {
        onImport(data);
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRawData(null);
    setFileName(null);
    setParseError(null);
    setTolerance(INITIAL_TOLERANCE);
  };

  const vertexWarning = getVertexWarning();

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Upload />}
        onClick={() => setOpen(true)}
        size="small">
        {formatMessage({ id: 'Import geometry' })}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{formatMessage({ id: 'Import geometry' })}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pt: 1,
              minHeight: 220
            }}>
            {parseError && (
              <Alert severity="error" onClose={() => setParseError(null)}>
                {parseError}
              </Alert>
            )}

            <FileSelectorInput
              multiple={false}
              accept={ACCEPTED_MIME}
              extensions={ACCEPTED_EXTENSIONS}
              files={fileName ? [{ fileName }] : []}
              onFilesAdd={handleFilesAdd}
              onFileRemove={handleFileRemove}
              disabled={analyzing}
            />

            {/* Spinner is always mounted (hidden via visibility:hidden +
                position:absolute) so its CSS animation keeps running in the
                background. When analyzing becomes true, switching to
                display:flex reveals an already-animated spinner instantly,
                avoiding the thin-arc appearance caused by the animation
                starting from frame 0 while the main thread is blocked. */}
            <Box
              sx={{
                alignItems: 'center',
                gap: 1,
                py: 1,
                ...(analyzing
                  ? { display: 'flex' }
                  : { position: 'absolute', visibility: 'hidden' })
              }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {formatMessage({ id: 'Analyzing geometry...' })}
              </Typography>
            </Box>

            {rawData && !analyzing && (
              <>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    {formatMessage({ id: 'Simplification Tolerance' })}:{' '}
                    {tolerance.toFixed(4)}
                  </Typography>
                  <Slider
                    value={tolerance}
                    onChange={(_e, val) => setTolerance(val)}
                    min={0.0}
                    max={maxTolerance}
                    step={step}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatMessage({ id: 'Precise' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatMessage({ id: 'Simplified' })}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatMessage({ id: 'Vertex count' })}: {vertexCount}
                  </Typography>
                  {vertexWarning && (
                    <Alert severity={vertexWarning.severity} sx={{ mt: 1 }}>
                      {vertexWarning.message}
                    </Alert>
                  )}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            {formatMessage({ id: 'Cancel' })}
          </Button>
          <Button
            onClick={handleImport}
            disabled={analyzing || !rawData}
            variant="contained">
            {formatMessage({ id: 'Import' })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

ShapefileImport.propTypes = {
  onImport: PropTypes.func.isRequired
};

export default ShapefileImport;
