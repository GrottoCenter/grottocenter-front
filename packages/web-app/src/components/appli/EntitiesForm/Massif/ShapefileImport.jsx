import React, { useRef, useState, useMemo } from 'react';
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
  Alert
} from '@mui/material';
import { Upload } from '@mui/icons-material';
import simplify from 'simplify-js';
import shp from 'shpjs';
import { transformToWGS84 } from '../../../../helpers/coordinateTransform';
import { countMultiPolygonVertices } from '../../../../helpers/vertexCount';

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

const ShapefileImport = ({ onImport, onError }) => {
  const { formatMessage } = useIntl();
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [tolerance, setTolerance] = useState(0.001);
  const [rawData, setRawData] = useState(null);

  const simplifiedData = useMemo(() => {
    if (!rawData) return null;
    return simplifyPolygon(rawData, tolerance);
  }, [rawData, tolerance]);

  const vertexCount = useMemo(() => {
    if (!simplifiedData) return 0;
    return countMultiPolygonVertices(simplifiedData.coordinates);
  }, [simplifiedData]);

  const getVertexWarning = () => {
    if (vertexCount > 2000) {
      return {
        severity: 'error',
        message: formatMessage({
          id: 'Too many vertices. This will cause browser issues. Increase simplification.'
        })
      };
    }
    if (vertexCount > 1000) {
      return {
        severity: 'warning',
        message: formatMessage({
          id: 'High vertex count may cause performance issues. Consider increasing simplification.'
        })
      };
    }
    if (vertexCount > 500) {
      return {
        severity: 'info',
        message: formatMessage({
          id: 'Moderate vertex count. May impact performance on older devices.'
        })
      };
    }
    return null;
  };

  const handleFileSelect = async event => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // Reset input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
        const text = await file.text();
        const geojson = JSON.parse(text);

        // Extract CRS information
        const sourceCRS = geojson.crs?.properties?.name;

        const multiPolygon = {
          type: 'MultiPolygon',
          coordinates: []
        };

        const addGeometry = geometry => {
          if (geometry.type === 'Polygon') {
            const transformed = sourceCRS
              ? transformToWGS84([geometry.coordinates], sourceCRS, 2)[0]
              : geometry.coordinates;
            multiPolygon.coordinates.push(transformed);
          } else if (geometry.type === 'MultiPolygon') {
            const transformed = sourceCRS
              ? transformToWGS84(geometry.coordinates, sourceCRS, 3)
              : geometry.coordinates;
            multiPolygon.coordinates.push(...transformed);
          }
        };

        if (geojson.type === 'FeatureCollection' && geojson.features) {
          geojson.features.forEach(feature => addGeometry(feature.geometry));
        } else if (geojson.type === 'Feature' && geojson.geometry) {
          addGeometry(geojson.geometry);
        } else if (
          geojson.type === 'Polygon' ||
          geojson.type === 'MultiPolygon'
        ) {
          addGeometry(geojson);
        }

        if (multiPolygon.coordinates.length === 0) {
          onError(
            formatMessage({ id: 'No polygon geometries found in GeoJSON' })
          );
          return;
        }

        setRawData(multiPolygon);
      } else if (fileName.endsWith('.zip')) {
        const arrayBuffer = await file.arrayBuffer();
        const geojson = await shp(arrayBuffer);

        // Extract CRS from shapefile (shpjs includes it if .prj file exists)
        const sourceCRS = geojson.crs?.properties?.name;

        const multiPolygon = {
          type: 'MultiPolygon',
          coordinates: []
        };

        if (geojson.features) {
          geojson.features.forEach(feature => {
            if (feature.geometry.type === 'Polygon') {
              const transformed = sourceCRS
                ? transformToWGS84(
                    [feature.geometry.coordinates],
                    sourceCRS,
                    2
                  )[0]
                : feature.geometry.coordinates;
              multiPolygon.coordinates.push(transformed);
            } else if (feature.geometry.type === 'MultiPolygon') {
              const transformed = sourceCRS
                ? transformToWGS84(feature.geometry.coordinates, sourceCRS, 3)
                : feature.geometry.coordinates;
              multiPolygon.coordinates.push(...transformed);
            }
          });
        }

        if (multiPolygon.coordinates.length === 0) {
          onError(
            formatMessage({ id: 'No polygon geometries found in shapefile.' })
          );
          return;
        }

        setRawData(multiPolygon);
      } else {
        onError(
          formatMessage({
            id: 'Please select a GeoJSON (.geojson) or Shapefile ZIP (.zip) file'
          })
        );
        return;
      }
    } catch (error) {
      console.error('File parsing error:', error);
      const errorMsg =
        typeof error === 'string'
          ? error
          : error?.message || error?.toString() || 'Unknown error';
      onError(formatMessage({ id: 'Failed to parse file' }) + `: ${errorMsg}`);
    }
  };

  const handleImport = () => {
    if (simplifiedData) {
      onImport(simplifiedData);
      setOpen(false);
      setRawData(null);
      setTolerance(0.001);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRawData(null);
    setTolerance(0.001);
  };

  const vertexWarning = getVertexWarning();

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Upload />}
        onClick={() => setOpen(true)}
        size="small"
      >
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
              paddingTop: '8px'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json,.zip"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => fileInputRef.current?.click()}
            >
              {formatMessage({ id: 'Upload File (.geojson, .json, .zip)' })}
            </Button>

            {rawData && (
              <>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    {formatMessage({ id: 'Simplification Tolerance' })}:{' '}
                    {tolerance.toFixed(4)}
                  </Typography>
                  <Slider
                    value={tolerance}
                    onChange={(e, val) => setTolerance(val)}
                    min={0.0001}
                    max={0.01}
                    step={0.0001}
                  />
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
          <Button onClick={handleClose}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!rawData || vertexCount > 2000}
            variant="contained"
          >
            {formatMessage({ id: 'Add to Map' })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

ShapefileImport.propTypes = {
  onImport: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired
};

export default ShapefileImport;
