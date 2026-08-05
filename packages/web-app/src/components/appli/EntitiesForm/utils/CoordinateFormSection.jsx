import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useController, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Button,
  Chip,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { Tune } from '@mui/icons-material';
import { useProjections, WGS84_DD, DMS_CODE } from '../../../../hooks';
import {
  convertProjectionToWGS84,
  convertWGS84ToProjection,
  decimalToDMS,
  formatWGS84,
  getUTMZone,
  parseDMS
} from '../../../../helpers/coordinateConvert';
import {
  validateLatitude,
  validateLongitude
} from '../../../../utils/validateLatLong';
import InputCoordinate from './InputCoordinate';
import MapMarkerSelector from './MapMarkerSelector';
import CRSMenu from '../../../common/CRSMenu';

const toFloat = v => {
  if (typeof v === 'number') return v;
  return parseFloat(String(v ?? '').replace(',', '.'));
};

const CoordinateFormSection = ({
  control,
  formLatitudeKey,
  formLongitudeKey,
  required = false,
  latitudeError,
  longitudeError,
  additionalPositions = [],
  additionalMarkersLabel,
  onZoomChange,
  markerIcon,
  mapHeight
}) => {
  const { formatMessage } = useIntl();
  const projections = useProjections();

  const { field: latField } = useController({ control, name: formLatitudeKey });
  const { field: lngField } = useController({
    control,
    name: formLongitudeKey
  });
  const watchedLat = useWatch({ control, name: formLatitudeKey });
  const watchedLng = useWatch({ control, name: formLongitudeKey });

  // Stable refs so effects don't need latField/lngField in their deps —
  // those objects are recreated on every render and would cause infinite loops.
  const latOnChangeRef = useRef(latField.onChange);
  latOnChangeRef.current = latField.onChange;
  const lngOnChangeRef = useRef(lngField.onChange);
  lngOnChangeRef.current = lngField.onChange;

  const degreesOption = useMemo(
    () => ({
      code: WGS84_DD,
      title: formatMessage({ id: 'Decimal degrees (WGS84)' }),
      units: 'degrees'
    }),
    [formatMessage]
  );
  const dmsOption = useMemo(
    () => ({
      code: DMS_CODE,
      title: formatMessage({ id: 'Degrees Minutes Seconds' }),
      units: 'degrees'
    }),
    [formatMessage]
  );

  const [selectedCRS, setSelectedCRS] = useState(degreesOption);
  const [crsMenuAnchor, setCrsMenuAnchor] = useState(null);
  const [localX, setLocalX] = useState('');
  const [localY, setLocalY] = useState('');
  const [utmZone, setUtmZone] = useState(31);
  const [utmHemisphere, setUtmHemisphere] = useState('North');
  const [preview, setPreview] = useState(null);
  const [conversionError, setConversionError] = useState(false);

  // Track the last WGS84 values we wrote ourselves, so we can ignore those
  // re-renders and only re-sync display fields on external changes (e.g. map drag)
  const selfSetRef = useRef({ lat: null, lng: null });

  const prefillFromWGS84 = useCallback((crs, lat, lng) => {
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    if (crs.code === WGS84_DD) return;
    if (crs.code === DMS_CODE) {
      setLocalX(decimalToDMS(lat, true));
      setLocalY(decimalToDMS(lng, false));
      return;
    }
    try {
      const { x, y, zone, hemisphere } = convertWGS84ToProjection(
        lat,
        lng,
        crs
      );
      setLocalX(crs.units === 'm' ? Math.round(x).toString() : x.toFixed(6));
      setLocalY(crs.units === 'm' ? Math.round(y).toString() : y.toFixed(6));
      if (crs.proj === 'utm' && zone) {
        setUtmZone(zone);
        setUtmHemisphere(hemisphere ?? 'North');
      }
    } catch {
      // No existing WGS84 coords to prefill from
    }
  }, []);

  const handleCRSChange = useCallback(
    newValue => {
      if (!newValue) return;
      setCrsMenuAnchor(null);
      setSelectedCRS(newValue);
      setLocalX('');
      setLocalY('');
      setPreview(null);
      setConversionError(false);

      if (newValue.code !== WGS84_DD) {
        const lat = toFloat(watchedLat);
        const lng = toFloat(watchedLng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          if (newValue.proj === 'utm') {
            setUtmZone(getUTMZone(lng));
            setUtmHemisphere(lat >= 0 ? 'North' : 'South');
          }
          prefillFromWGS84(newValue, lat, lng);
        }
      }
    },
    [watchedLat, watchedLng, prefillFromWGS84]
  );

  const handleCRSSelect = useCallback(
    code => {
      if (code === WGS84_DD) handleCRSChange(degreesOption);
      else if (code === DMS_CODE) handleCRSChange(dmsOption);
      else {
        const proj = projections.find(p => p.code === code);
        if (proj) handleCRSChange(proj);
      }
    },
    [handleCRSChange, degreesOption, dmsOption, projections]
  );

  // Whenever local X/Y change, convert to WGS84 and update form fields
  useEffect(() => {
    if (selectedCRS.code === WGS84_DD) return;

    if (selectedCRS.code === DMS_CODE) {
      const lat = parseDMS(localX);
      const lng = parseDMS(localY);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const latStr = lat.toFixed(6);
          const lngStr = lng.toFixed(6);
          selfSetRef.current = { lat: latStr, lng: lngStr };
          latOnChangeRef.current(latStr);
          lngOnChangeRef.current(lngStr);
          setPreview({ lat, lng });
          setConversionError(false);
        } else {
          setPreview(null);
          setConversionError(true);
        }
      } else {
        setPreview(null);
        // Don't mark as error while user is still typing
        setConversionError(false);
      }
      return;
    }

    const x = parseFloat(localX);
    const y = parseFloat(localY);
    if (Number.isNaN(x) || Number.isNaN(y) || !localX || !localY) {
      setPreview(null);
      setConversionError(false);
      return;
    }

    try {
      const { lat, lng } = convertProjectionToWGS84(
        x,
        y,
        selectedCRS,
        utmZone,
        utmHemisphere
      );
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const latStr = lat.toFixed(6);
        const lngStr = lng.toFixed(6);
        selfSetRef.current = { lat: latStr, lng: lngStr };
        latOnChangeRef.current(latStr);
        lngOnChangeRef.current(lngStr);
        setPreview({ lat, lng });
        setConversionError(false);
      } else {
        setPreview(null);
        setConversionError(true);
      }
    } catch {
      setPreview(null);
      setConversionError(true);
    }
  }, [localX, localY, selectedCRS, utmZone, utmHemisphere]);

  // When the form WGS84 values change externally (e.g. map drag), re-sync display fields
  useEffect(() => {
    if (selectedCRS.code === WGS84_DD) return;
    const latStr = String(watchedLat ?? '');
    const lngStr = String(watchedLng ?? '');
    if (latStr === selfSetRef.current.lat && lngStr === selfSetRef.current.lng)
      return;
    const lat = toFloat(watchedLat);
    const lng = toFloat(watchedLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    prefillFromWGS84(selectedCRS, lat, lng);
    setPreview({ lat, lng });
    setConversionError(false);
    // Intentionally omitting selectedCRS and prefillFromWGS84: we only want to
    // re-sync on external WGS84 changes (e.g. map drag), not on CRS switches
    // (those are handled by handleCRSChange).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedLat, watchedLng]);

  const isWGS84 = selectedCRS.code === WGS84_DD;
  const isDMS = selectedCRS.code === DMS_CODE;
  const isUTM = selectedCRS.proj === 'utm';
  const isMetric = selectedCRS.units === 'm';

  const xLabel = isMetric
    ? formatMessage({ id: 'Easting' })
    : formatMessage({ id: 'Latitude' });
  const yLabel = isMetric
    ? formatMessage({ id: 'Northing' })
    : formatMessage({ id: 'Longitude' });

  const crsShortLabels = { [WGS84_DD]: 'WGS84', [DMS_CODE]: 'DMS' };
  const crsButtonLabel = crsShortLabels[selectedCRS.code] ?? selectedCRS.title;

  return (
    <>
      <MapMarkerSelector
        control={control}
        formLatitudeKey={formLatitudeKey}
        formLongitudeKey={formLongitudeKey}
        additionalPositions={additionalPositions}
        additionalMarkersLabel={additionalMarkersLabel}
        onZoomChange={onZoomChange}
        markerIcon={markerIcon}
        mapHeight={mapHeight}
      />
      {/* CRS selector + coordinate fields, below the map */}
      <Box display="flex" alignItems="flex-start" gap={0.5} mt={0.5} mb={0.5}>
        <Tooltip title={formatMessage({ id: 'Change coordinate system' })}>
          <Button
            variant="outlined"
            size="small"
            onClick={e => setCrsMenuAnchor(e.currentTarget)}
            startIcon={<Tune fontSize="small" />}
            sx={{
              color: 'text.secondary',
              borderColor: 'divider',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              alignSelf: 'stretch',
              // Each field is a MuiFormControl with 4px vertical padding (theme),
              // insetting its grey box. Matching that margin makes the stretched
              // button line up exactly with the fields — on desktop (one field's
              // height) and on mobile (spanning both stacked lat/lng fields).
              my: '4px'
            }}>
            {crsButtonLabel}
          </Button>
        </Tooltip>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 0.5
          }}>
          {isWGS84 ? (
            <>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <InputCoordinate
                  formKey={formLatitudeKey}
                  labelName="Latitude"
                  control={control}
                  validatorFn={validateLatitude}
                  isError={!!latitudeError}
                  helperText={latitudeError}
                  isRequired={required}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <InputCoordinate
                  formKey={formLongitudeKey}
                  labelName="Longitude"
                  control={control}
                  validatorFn={validateLongitude}
                  isError={!!longitudeError}
                  helperText={longitudeError}
                  isRequired={required}
                />
              </Box>
            </>
          ) : (
            <>
              <TextField
                fullWidth
                label={xLabel}
                size="small"
                value={localX}
                onChange={e => setLocalX(e.target.value)}
                inputProps={{
                  inputMode: isDMS ? 'text' : 'decimal',
                  placeholder: isDMS ? `48°31'24.2"N` : undefined
                }}
                error={conversionError}
              />
              <TextField
                fullWidth
                label={yLabel}
                size="small"
                value={localY}
                onChange={e => setLocalY(e.target.value)}
                inputProps={{
                  inputMode: isDMS ? 'text' : 'decimal',
                  placeholder: isDMS ? `2°09'24.1"E` : undefined
                }}
                error={conversionError}
              />
            </>
          )}
        </Box>
      </Box>
      {/* UTM zone/hemisphere — separate row, only when needed */}
      {!isWGS84 && isUTM && (
        <Box display="flex" gap={0.5} mb={0.5}>
          <TextField
            label={formatMessage({ id: 'Zone' })}
            type="number"
            size="small"
            value={utmZone}
            onChange={e => setUtmZone(Number(e.target.value))}
            inputProps={{ min: 1, max: 60, inputMode: 'numeric' }}
            sx={{ width: 100 }}
          />
          <TextField
            label={formatMessage({ id: 'Hemisphere' })}
            select
            size="small"
            value={utmHemisphere}
            onChange={e => setUtmHemisphere(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ width: 140 }}>
            <option value="North">{formatMessage({ id: 'North' })}</option>
            <option value="South">{formatMessage({ id: 'South' })}</option>
          </TextField>
        </Box>
      )}
      {!isWGS84 && conversionError && (
        <Alert severity="error" sx={{ mb: 0.5 }}>
          {formatMessage({ id: 'Invalid coordinates' })}
        </Alert>
      )}
      {!isWGS84 && preview && (
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <Typography variant="caption" color="text.secondary">
            ≈ WGS84 :
          </Typography>
          <Chip
            label={formatWGS84(preview.lat, preview.lng, 4)}
            size="small"
            color="success"
            variant="outlined"
          />
        </Box>
      )}
      <CRSMenu
        anchorEl={crsMenuAnchor}
        onClose={() => setCrsMenuAnchor(null)}
        preferred={selectedCRS.code}
        projections={projections}
        onSelect={handleCRSSelect}
      />
    </>
  );
};

CoordinateFormSection.propTypes = {
  control: PropTypes.shape({}).isRequired,
  formLatitudeKey: PropTypes.string.isRequired,
  formLongitudeKey: PropTypes.string.isRequired,
  required: PropTypes.bool,
  latitudeError: PropTypes.string,
  longitudeError: PropTypes.string,
  additionalPositions: PropTypes.arrayOf(PropTypes.shape({})),
  additionalMarkersLabel: PropTypes.string,
  onZoomChange: PropTypes.func,
  markerIcon: PropTypes.string,
  mapHeight: PropTypes.string
};

export default CoordinateFormSection;
