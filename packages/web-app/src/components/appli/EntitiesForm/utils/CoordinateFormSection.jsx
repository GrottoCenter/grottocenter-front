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
  formAccuracyKey,
  required = false,
  latitudeError,
  longitudeError,
  additionalPositions = [],
  additionalMarkersLabel,
  onZoomChange,
  onLocationAccuracyChange,
  accuracyField,
  markerIcon,
  mapHeight
}) => {
  const { formatMessage } = useIntl();
  const projections = useProjections();

  const { field: latField } = useController({
    control,
    name: formLatitudeKey,
    rules: {
      required: required && formatMessage({ id: 'Required' }),
      validate: value =>
        value === '' ||
        value == null ||
        (Number.isFinite(toFloat(value))
          ? validateLatitude(toFloat(value), formatMessage)
          : formatMessage({ id: 'Invalid coordinates' }))
    }
  });
  const { field: lngField } = useController({
    control,
    name: formLongitudeKey,
    rules: {
      required: required && formatMessage({ id: 'Required' }),
      validate: value =>
        value === '' ||
        value == null ||
        (Number.isFinite(toFloat(value))
          ? validateLongitude(toFloat(value), formatMessage)
          : formatMessage({ id: 'Invalid coordinates' }))
    }
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
  const prefilledValuesRef = useRef(null);

  const prefillFromWGS84 = useCallback((crs, lat, lng) => {
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    if (crs.code === WGS84_DD) return;
    if (crs.code === DMS_CODE) {
      const x = decimalToDMS(lat, true);
      const y = decimalToDMS(lng, false);
      prefilledValuesRef.current = { x, y, crs: crs.code };
      setLocalX(x);
      setLocalY(y);
      setPreview({ lat, lng });
      return;
    }
    try {
      const { x, y, zone, hemisphere } = convertWGS84ToProjection(
        lat,
        lng,
        crs
      );
      const displayX =
        crs.units === 'm' ? Math.round(x).toString() : x.toFixed(6);
      const displayY =
        crs.units === 'm' ? Math.round(y).toString() : y.toFixed(6);
      prefilledValuesRef.current = {
        x: displayX,
        y: displayY,
        crs: crs.code,
        zone,
        hemisphere: hemisphere ?? 'North'
      };
      setLocalX(displayX);
      setLocalY(displayY);
      setPreview({ lat, lng });
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

    // Display conversions may round to whole meters. They must not move the
    // saved point or invalidate its accuracy until a contributor edits a field.
    const prefilled = prefilledValuesRef.current;
    if (
      prefilled &&
      prefilled.crs === selectedCRS.code &&
      prefilled.x === localX &&
      prefilled.y === localY &&
      (selectedCRS.proj !== 'utm' ||
        (prefilled.zone === utmZone && prefilled.hemisphere === utmHemisphere))
    ) {
      return;
    }
    prefilledValuesRef.current = null;

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
        onLatitudeChange={latField.onChange}
        onLongitudeChange={lngField.onChange}
        formAccuracyKey={formAccuracyKey}
        additionalPositions={additionalPositions}
        additionalMarkersLabel={additionalMarkersLabel}
        onZoomChange={onZoomChange}
        onLocationAccuracyChange={onLocationAccuracyChange}
        markerIcon={markerIcon}
        mapHeight={mapHeight}
      />
      {/* CRS selector + coordinate fields, below the map */}
      <Box
        sx={{
          display: { xs: accuracyField ? 'grid' : 'flex', sm: 'flex' },
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)',
          gridTemplateAreas: '"crs latitude" "accuracy longitude"',
          alignItems: 'flex-start',
          gap: 0.5,
          mt: 0.5,
          mb: 0.5
        }}>
        <Tooltip title={formatMessage({ id: 'Change coordinate system' })}>
          <Button
            variant="outlined"
            size="small"
            data-testid="coordinate-system-selector"
            onClick={e => setCrsMenuAnchor(e.currentTarget)}
            startIcon={<Tune fontSize="small" />}
            sx={{
              color: 'text.secondary',
              borderColor: 'divider',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              alignSelf: 'stretch',
              gridArea: 'crs',
              // Each field is a MuiFormControl with 4px vertical padding (theme),
              // insetting its grey box. Matching that margin makes the stretched
              // button line up with the fields. On mobile, latitude and the
              // button share a grid row so their heights stay aligned.
              my: 0.5
            }}>
            {crsButtonLabel}
          </Button>
        </Tooltip>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: { xs: accuracyField ? 'contents' : 'flex', sm: 'flex' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 0.5
          }}>
          {isWGS84 ? (
            <>
              <Box sx={{ flex: 1, minWidth: 0, gridArea: 'latitude' }}>
                <InputCoordinate
                  field={latField}
                  labelName="Latitude"
                  isError={!!latitudeError}
                  helperText={latitudeError}
                  isRequired={required}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, gridArea: 'longitude' }}>
                <InputCoordinate
                  field={lngField}
                  labelName="Longitude"
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
                sx={{ gridArea: 'latitude' }}
                value={localX}
                onChange={e => setLocalX(e.target.value)}
                error={conversionError}
                slotProps={{
                  htmlInput: {
                    inputMode: isDMS ? 'text' : 'decimal',
                    placeholder: isDMS ? `48°31'24.2"N` : undefined
                  }
                }}
              />
              <TextField
                fullWidth
                label={yLabel}
                size="small"
                sx={{ gridArea: 'longitude' }}
                value={localY}
                onChange={e => setLocalY(e.target.value)}
                error={conversionError}
                slotProps={{
                  htmlInput: {
                    inputMode: isDMS ? 'text' : 'decimal',
                    placeholder: isDMS ? `2°09'24.1"E` : undefined
                  }
                }}
              />
            </>
          )}
        </Box>
        {accuracyField && (
          <Box
            sx={{
              width: { xs: '100%', sm: 136 },
              flexShrink: 0,
              gridArea: 'accuracy',
              alignSelf: 'flex-start'
            }}>
            {accuracyField}
          </Box>
        )}
      </Box>
      {/* UTM zone/hemisphere — separate row, only when needed */}
      {!isWGS84 && isUTM && (
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            mb: 0.5
          }}>
          <TextField
            label={formatMessage({ id: 'Zone' })}
            type="number"
            size="small"
            value={utmZone}
            onChange={e => setUtmZone(Number(e.target.value))}
            sx={{ width: 100 }}
            slotProps={{
              htmlInput: { min: 1, max: 60, inputMode: 'numeric' }
            }}
          />
          <TextField
            label={formatMessage({ id: 'Hemisphere' })}
            select
            size="small"
            value={utmHemisphere}
            onChange={e => setUtmHemisphere(e.target.value)}
            sx={{ width: 140 }}
            slotProps={{
              select: { native: true }
            }}>
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mb: 0.5
          }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary'
            }}>
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
  formAccuracyKey: PropTypes.string,
  required: PropTypes.bool,
  latitudeError: PropTypes.string,
  longitudeError: PropTypes.string,
  additionalPositions: PropTypes.arrayOf(PropTypes.shape({})),
  additionalMarkersLabel: PropTypes.string,
  onZoomChange: PropTypes.func,
  onLocationAccuracyChange: PropTypes.func,
  accuracyField: PropTypes.node,
  markerIcon: PropTypes.string,
  mapHeight: PropTypes.string
};

export default CoordinateFormSection;
