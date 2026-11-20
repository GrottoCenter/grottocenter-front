import { useCallback, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Button,
  Slider,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Upload } from '@mui/icons-material';
import shp from 'shpjs';
import StandardDialog from '@/components/common/StandardDialog';
import { useGeometrySimplification } from '@/hooks/useGeometrySimplification';
import { INFO_VERTICES } from '@/utils/geometrySimplification';
import { parseGeoJsonToMultiPolygon } from '../../../../helpers/geojsonParser';
import FileSelectorInput from '../../../common/FileSelectorInput';

const DANGER_VERTICES = 2000;
const WARN_VERTICES = 1000;

const ACCEPTED_EXTENSIONS = ['.geojson', '.json', '.zip'];
const ACCEPTED_MIME = {
  'application/geo+json': ['.geojson', '.json'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip']
};

const ShapefileImport = ({ onImport }) => {
  const { formatMessage } = useIntl();
  const sessionRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [rawData, setRawData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [parseError, setParseError] = useState(null);

  const [isParsing, setIsParsing] = useState(false);
  const handleSimplificationError = useCallback(() => {
    setParseError(formatMessage({ id: 'Failed to parse file' }));
    setRawData(null);
  }, [formatMessage]);
  const {
    tolerance,
    updateTolerance,
    reset: resetSimplification,
    simplifiedData,
    vertexCount,
    isAnalyzing,
    isSimplifying,
    sliderParams
  } = useGeometrySimplification(rawData, handleSimplificationError);

  useEffect(
    () => () => {
      sessionRef.current += 1;
    },
    []
  );

  const { maxTolerance, step, minAchievableCount } = sliderParams;

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

    const session = ++sessionRef.current;
    resetSimplification();
    setRawData(null);
    setFileName(null);
    setParseError(null);
    setIsParsing(true);

    const name = file.name.toLowerCase();

    try {
      if (name.endsWith('.geojson') || name.endsWith('.json')) {
        const text = await file.text();
        if (session !== sessionRef.current) return;
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
        if (session !== sessionRef.current) return;
        const geojson = await shp(arrayBuffer);
        if (session !== sessionRef.current) return;
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
      if (session !== sessionRef.current) return;
      console.error('File parsing error:', error);
      const errorMsg =
        typeof error === 'string'
          ? error
          : error?.message || error?.toString() || 'Unknown error';
      setParseError(
        `${formatMessage({ id: 'Failed to parse file' })}: ${errorMsg}`
      );
    } finally {
      if (session === sessionRef.current) setIsParsing(false);
    }
  };

  const handleFileRemove = () => {
    sessionRef.current += 1;
    resetSimplification();
    setIsParsing(false);
    setRawData(null);
    setFileName(null);
    setParseError(null);
  };

  const handleFileRejections = () => {
    setParseError(
      formatMessage({
        id: 'Please select a GeoJSON (.geojson) or Shapefile ZIP (.zip) file'
      })
    );
  };

  const handleImport = () => {
    if (simplifiedData && !isParsing && !isAnalyzing && !isSimplifying) {
      const data = simplifiedData;
      setOpen(false);
      handleFileRemove();
      // Defer the heavy onImport so the dialog closes first
      requestAnimationFrame(() => {
        onImport(data);
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    handleFileRemove();
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
      <StandardDialog
        open={open}
        onClose={handleClose}
        fullScreenOnMobile
        title={formatMessage({ id: 'Import geometry' })}
        actions={
          <>
            <Button onClick={handleClose} variant="outlined">
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                isParsing || isAnalyzing || isSimplifying || !simplifiedData
              }
              variant="contained">
              {formatMessage({ id: 'Import' })}
            </Button>
          </>
        }>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            pt: 0.5,
            minHeight: 220
          }}>
          {parseError && (
            <Alert severity="error" onClose={() => setParseError(null)}>
              {parseError}
            </Alert>
          )}

          <FileSelectorInput
            multiple={false}
            maxFiles={1}
            accept={ACCEPTED_MIME}
            extensions={ACCEPTED_EXTENSIONS}
            files={fileName ? [{ fileName }] : []}
            onFilesAdd={handleFilesAdd}
            onFileRemove={handleFileRemove}
            onFileRejections={handleFileRejections}
            disabled={isAnalyzing || isParsing}
          />

          {(isParsing || isAnalyzing || isSimplifying) && (
            <Box
              role="status"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                py: 0.5
              }}>
              <CircularProgress size={20} aria-hidden />
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary'
                }}>
                {formatMessage({ id: 'Analyzing geometry...' })}
              </Typography>
            </Box>
          )}

          {rawData && !isAnalyzing && (
            <>
              <Box>
                <Typography variant="body2" gutterBottom>
                  {formatMessage({ id: 'Simplification Tolerance' })}:{' '}
                  {tolerance.toFixed(4)}
                </Typography>
                <Slider
                  value={tolerance}
                  onChange={(_event, value) => updateTolerance(value)}
                  aria-label={formatMessage({
                    id: 'Simplification Tolerance'
                  })}
                  min={0.0}
                  max={maxTolerance}
                  step={step}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary'
                    }}>
                    {formatMessage({ id: 'Precise' })}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary'
                    }}>
                    {formatMessage({ id: 'Simplified' })}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary'
                  }}>
                  {formatMessage({ id: 'Vertex count' })}: {vertexCount}
                </Typography>
                {vertexWarning && (
                  <Alert severity={vertexWarning.severity} sx={{ mt: 0.5 }}>
                    {vertexWarning.message}
                  </Alert>
                )}
              </Box>
            </>
          )}
        </Box>
      </StandardDialog>
    </>
  );
};

ShapefileImport.propTypes = {
  onImport: PropTypes.func.isRequired
};

export default ShapefileImport;
