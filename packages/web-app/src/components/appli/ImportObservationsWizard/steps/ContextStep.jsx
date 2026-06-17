import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useForm, useWatch } from 'react-hook-form';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CoordinateFormSection from '../../EntitiesForm/utils/CoordinateFormSection';
import { coordinatesMarkerIcon } from '../../../../assets/icons';

import {
  SET_CONTEXT,
  SET_DOCUMENT_LANGUAGE,
  SET_SAMPLING_INTERVAL,
  fetchCaveById,
  fetchCaverById
} from '../../../../actions/Observations/importWizard';
import { fetchLicense } from '../../../../actions/Licenses';
import { useUserProperties } from '../../../../hooks';
import CaveAutoCompleteSearch from '../../../common/AutoCompleteSearch/CaveAutoCompleteSearch';
import AuthorsSelect from '../../../common/AuthorsSelect';
import LanguageSelect from '../../../common/LanguageSelect';

// ===== Constants =====

// Only ODBL (id:1), ODC-BY (id:2), Licence Ouverte (id:3) — no Creative Commons
const ALLOWED_LICENSE_NAMES = ['ODbL', 'ODC-BY', 'Licence Ouverte'];

const DATA_QUALITY_OPTIONS = ['raw', 'validated'];

const TEXT_FIELD_MAX_LENGTH = 200;

// ===== ContextStep component =====

const ContextStep = ({ initialCaveId, caveIdLocked }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  // Redux state
  const context = useSelector(state => state.importWizard.context);
  const documentLanguage = useSelector(
    state => state.importWizard.documentLanguage
  );
  const samplingIntervalSeconds = useSelector(
    state => state.importWizard.samplingIntervalSeconds
  );

  // Licenses from Redux
  const { data: allLicenses, loading: licensesLoading } = useSelector(
    state => state.licenses
  );

  // Current user
  const currentUser = useUserProperties();

  // Local state for authors (synced with Redux context.authorIds)
  const [selectedAuthors, setSelectedAuthors] = useState([]);

  // Local state for cave (to display the name after selection or profile import)
  const [selectedCave, setSelectedCave] = useState(null);

  // Entrances of the selected cave (non-sensitive, with coordinates) for map display
  const [caveEntrances, setCaveEntrances] = useState([]);

  // Local state for samplingInterval (editable field)
  const [localSamplingInterval, setLocalSamplingInterval] = useState(
    samplingIntervalSeconds !== null ? String(samplingIntervalSeconds) : ''
  );

  // Track whether we pre-filled the authors once
  const hasPrefilledAuthorRef = useRef(false);

  // Local react-hook-form for CoordinateFormSection integration
  const { control: coordControl, setValue: setCoordValue } = useForm({
    defaultValues: {
      latitude: context.latitude != null ? String(context.latitude) : '',
      longitude: context.longitude != null ? String(context.longitude) : ''
    }
  });

  // Sync: react-hook-form → Redux
  const watchedLat = useWatch({ control: coordControl, name: 'latitude' });
  const watchedLng = useWatch({ control: coordControl, name: 'longitude' });
  const prevCoordsRef = useRef({ lat: watchedLat, lng: watchedLng });

  useEffect(() => {
    if (
      watchedLat === prevCoordsRef.current.lat &&
      watchedLng === prevCoordsRef.current.lng
    ) return;
    prevCoordsRef.current = { lat: watchedLat, lng: watchedLng };

    const lat = watchedLat === '' ? null : Number(watchedLat);
    const lng = watchedLng === '' ? null : Number(watchedLng);
    const safeLat = lat !== null && !Number.isNaN(lat) ? lat : null;
    const safeLng = lng !== null && !Number.isNaN(lng) ? lng : null;

    if (safeLat !== context.latitude || safeLng !== context.longitude) {
      dispatch({
        type: SET_CONTEXT,
        context: { latitude: safeLat, longitude: safeLng }
      });
    }
    // Intentionally excluding dispatch and context from deps — this effect
    // syncs form → Redux only when the watched form values change.
    // Including context would create an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedLat, watchedLng]);

  // Sync: Redux → react-hook-form (e.g. profile import)
  useEffect(() => {
    const formLat = watchedLat === '' ? null : Number(watchedLat);
    const formLng = watchedLng === '' ? null : Number(watchedLng);
    const reduxLat = context.latitude;
    const reduxLng = context.longitude;

    if (reduxLat !== formLat) {
      setCoordValue(
        'latitude',
        reduxLat != null ? String(reduxLat) : '',
        { shouldValidate: false }
      );
    }
    if (reduxLng !== formLng) {
      setCoordValue(
        'longitude',
        reduxLng != null ? String(reduxLng) : '',
        { shouldValidate: false }
      );
    }
    // Intentionally excluding watchedLat/watchedLng and setCoordValue — this
    // effect syncs Redux → form only when Redux coordinates change externally
    // (e.g. profile import). Including form values would create a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.latitude, context.longitude]);

  // Fetch licenses on mount
  useEffect(() => {
    if (!allLicenses && !licensesLoading) {
      dispatch(fetchLicense());
    }
  }, [dispatch, allLicenses, licensesLoading]);

  // Pre-fill cave when locked
  useEffect(() => {
    if (caveIdLocked && initialCaveId !== null && context.caveId !== initialCaveId) {
      dispatch({
        type: SET_CONTEXT,
        context: { caveId: initialCaveId, caveIdLocked: true }
      });
    }
    // Excluding dispatch and context.caveId — this runs only when the locked
    // cave prop changes, not on every Redux context update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caveIdLocked, initialCaveId]);

  // Pre-fill authors with authenticated user (once)
  useEffect(() => {
    if (hasPrefilledAuthorRef.current) return;
    if (!currentUser.id) return;
    if (context.authorIds.length > 0) return;
    hasPrefilledAuthorRef.current = true;
    const author = { id: currentUser.id, nickname: currentUser.nickname };
    setSelectedAuthors([author]);
    dispatch({ type: SET_CONTEXT, context: { authorIds: [currentUser.id] } });
    // Excluding dispatch, context.authorIds, currentUser.nickname —
    // hasPrefilledAuthorRef guards against multiple runs; we only pre-fill once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  // Sync samplingIntervalSeconds from Redux to local state when it changes externally
  useEffect(() => {
    if (samplingIntervalSeconds !== null && localSamplingInterval === '') {
      setLocalSamplingInterval(String(samplingIntervalSeconds));
    }
    // Excluding localSamplingInterval — we only sync when the Redux value
    // changes externally (auto-detected), not when the user types.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samplingIntervalSeconds]);

  // Fetch cave when caveId is set but no cave object is known (e.g. from profile import)
  useEffect(() => {
    if (!context.caveId || selectedCave) {
      if (!context.caveId) {
        setSelectedCave(null);
        setCaveEntrances([]);
      }
      return undefined;
    }

    const abortController = new AbortController();

    dispatch(fetchCaveById(context.caveId, { signal: abortController.signal }))
      .then(data => {
        if (!data) return;
        const name = data.name
          || (data.entrances && data.entrances[0] && data.entrances[0].name)
          || `#${data.id}`;
        setSelectedCave({
          id: data.id,
          name,
          depth: data.depth || null,
          length: data.length || null
        });

        const eligibleEntrances = (data.entrances || []).filter(
          e =>
            !e.isSensitive &&
            e.latitude != null &&
            e.longitude != null
        );
        setCaveEntrances(eligibleEntrances);

        if (
          !context.unknownCoordinates &&
          context.latitude == null &&
          context.longitude == null &&
          eligibleEntrances.length > 0
        ) {
          const entrance = eligibleEntrances[0];
          dispatch({
            type: SET_CONTEXT,
            context: {
              latitude: entrance.latitude,
              longitude: entrance.longitude
            }
          });
        }
      });

    return () => abortController.abort();
    // Excluding dispatch, selectedCave, context.latitude,
    // context.longitude — this fetches cave data only when caveId changes
    // (e.g. from profile import). Including selectedCave would skip the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.caveId]);

  // Restore authors from context.authorIds when selectedAuthors is empty (e.g. from profile import)
  useEffect(() => {
    if (!context.authorIds || context.authorIds.length === 0 || selectedAuthors.length > 0)
      return undefined;

    const abortController = new AbortController();
    let cancelled = false;

    Promise.all(
      context.authorIds.map(id =>
        dispatch(fetchCaverById(id, { signal: abortController.signal }))
      )
    ).then(results => {
      if (cancelled) return;
      const authors = results
        .filter(Boolean)
        .map(data => ({ id: data.id, nickname: data.nickname }));
      if (authors.length > 0) setSelectedAuthors(authors);
    });

    return () => {
      cancelled = true;
      abortController.abort();
    };
    // Excluding selectedAuthors — this restores authors
    // display only when authorIds changes (e.g. profile import) and no authors
    // are already selected locally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.authorIds]);

  // Filtered licenses (no Creative Commons)
  const allowedLicenses = allLicenses
    ? allLicenses.filter(l => ALLOWED_LICENSE_NAMES.includes(l.name))
    : [];

  // ===== Handlers =====

  const handleLocationModeChange = e => {
    const newMode = e.target.value;
    const updates = { locationMode: newMode };

    // Clear values for hidden sections
    if (newMode === 'caveOnly') {
      updates.pointLabel = '';
      updates.latitude = null;
      updates.longitude = null;
      updates.unknownCoordinates = false;
      setCoordValue('latitude', '', { shouldValidate: false });
      setCoordValue('longitude', '', { shouldValidate: false });
    } else if (newMode === 'pointOnly') {
      updates.caveId = null;
      setSelectedCave(null);
      setCaveEntrances([]);
    }

    dispatch({ type: SET_CONTEXT, context: updates });
  };

  const handleUnknownCoordinatesChange = e => {
    const checked = e.target.checked;
    const updates = { unknownCoordinates: checked };

    if (checked) {
      updates.latitude = null;
      updates.longitude = null;
      setCoordValue('latitude', '', { shouldValidate: false });
      setCoordValue('longitude', '', { shouldValidate: false });
    }

    dispatch({ type: SET_CONTEXT, context: updates });
  };

  const handleFieldChange = (field, value) => {
    dispatch({ type: SET_CONTEXT, context: { [field]: value } });
  };

  const handleObservationNameChange = e => {
    const value = e.target.value || null;
    // Document title mirrors observation name
    dispatch({
      type: SET_CONTEXT,
      context: { observationName: value, documentTitle: value }
    });
  };

  const handleLanguageChange = value => {
    dispatch({
      type: SET_DOCUMENT_LANGUAGE,
      documentLanguage: value
    });
  };

  const handleCaveSelection = cave => {
    setSelectedCave(cave);
    dispatch({ type: SET_CONTEXT, context: { caveId: cave ? cave.id : null } });

    if (cave) {
      // Fetch cave details to pre-fill coordinates from first eligible entrance
      dispatch(fetchCaveById(cave.id))
        .then(data => {
          if (!data || !data.entrances) return;
          const eligibleEntrances = data.entrances.filter(
            e =>
              !e.isSensitive &&
              e.latitude != null &&
              e.longitude != null
          );
          setCaveEntrances(eligibleEntrances);

          const entrance = eligibleEntrances[0];
          if (entrance && !context.unknownCoordinates) {
            dispatch({
              type: SET_CONTEXT,
              context: {
                latitude: entrance.latitude,
                longitude: entrance.longitude
              }
            });
          }
        });
    } else {
      setCaveEntrances([]);
    }
  };

  const handleClearCave = () => {
    setSelectedCave(null);
    dispatch({ type: SET_CONTEXT, context: { caveId: null } });
  };

  const handleAuthorsChange = newAuthors => {
    setSelectedAuthors(newAuthors);
    dispatch({
      type: SET_CONTEXT,
      context: { authorIds: newAuthors.map(a => a.id) }
    });
  };

  const handleSamplingIntervalChange = e => {
    const raw = e.target.value;
    setLocalSamplingInterval(raw);
    const parsed = parseInt(raw, 10);
    const newValue = raw === '' || Number.isNaN(parsed) ? null : parsed;
    dispatch({ type: SET_SAMPLING_INTERVAL, samplingIntervalSeconds: newValue });
  };

  // ===== Render =====

  const showPoint = context.locationMode !== 'caveOnly';
  const showCave = context.locationMode !== 'pointOnly';
  const showCoordinates = showPoint && !context.unknownCoordinates;

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      data-testid="context-step">

      {/* Location mode toggle */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {formatMessage({
            id: 'ImportObservationsWizard.ContextStep.locationModeLabel'
          })}
        </Typography>
        <RadioGroup
          row
          value={context.locationMode || 'pointAndCave'}
          onChange={handleLocationModeChange}
          data-testid="location-mode-radio">
          <FormControlLabel
            value="pointAndCave"
            control={<Radio size="small" />}
            label={formatMessage({
              id: 'ImportObservationsWizard.ContextStep.locationMode.pointAndCave'
            })}
          />
          <FormControlLabel
            value="pointOnly"
            control={<Radio size="small" />}
            disabled={caveIdLocked}
            label={formatMessage({
              id: 'ImportObservationsWizard.ContextStep.locationMode.pointOnly'
            })}
          />
          <FormControlLabel
            value="caveOnly"
            control={<Radio size="small" />}
            label={formatMessage({
              id: 'ImportObservationsWizard.ContextStep.locationMode.caveOnly'
            })}
          />
        </RadioGroup>
      </Box>

      {/* Cave selection */}
      {showCave && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1, maxWidth: 480 }}>
            <Typography variant="subtitle2" gutterBottom>
              {formatMessage({ id: 'ImportObservationsWizard.ContextStep.caveLabel' })}
            </Typography>
            <CaveAutoCompleteSearch
              key={selectedCave ? selectedCave.id : 'empty'}
              onSelection={handleCaveSelection}
              value={selectedCave}
              disabled={caveIdLocked}
            />
          </Box>
          {context.caveId && !caveIdLocked && (
            <IconButton
              onClick={handleClearCave}
              size="small"
              sx={{ mt: 4 }}
              data-testid="clear-cave-button"
              aria-label={formatMessage({
                id: 'ImportObservationsWizard.ContextStep.clearCave'
              })}>
              <ClearIcon />
            </IconButton>
          )}
        </Box>
      )}

      {/* Point label + location */}
      {showPoint && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            required
            variant="filled"
            label={formatMessage({ id: 'ImportObservationsWizard.ContextStep.pointLabel' })}
            placeholder={formatMessage({
              id: 'ImportObservationsWizard.ContextStep.pointLabelPlaceholder'
            })}
            value={context.pointLabel || ''}
            onChange={e => handleFieldChange('pointLabel', e.target.value)}
            size="small"
            sx={{ minWidth: 200, maxWidth: 280 }}
            slotProps={{ htmlInput: { maxLength: TEXT_FIELD_MAX_LENGTH } }}
            data-testid="point-label-field"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={!!context.unknownCoordinates}
                onChange={handleUnknownCoordinatesChange}
                size="small"
                data-testid="unknown-coordinates-checkbox"
              />
            }
            label={formatMessage({
              id: 'ImportObservationsWizard.ContextStep.unknownCoordinates'
            })}
          />
          {showCoordinates && (
            <CoordinateFormSection
              control={coordControl}
              formLatitudeKey="latitude"
              formLongitudeKey="longitude"
              additionalPositions={caveEntrances}
              markerIcon={coordinatesMarkerIcon}
              mapHeight="50dvh"
            />
          )}
        </Box>
      )}

      {/* Observation name + language */}
      <Box sx={{ display: 'flex', gap: 2, maxWidth: 480, alignItems: 'flex-start' }}>
        <TextField
          variant="filled"
          label={formatMessage({
            id: 'ImportObservationsWizard.ContextStep.observationName'
          })}
          placeholder={formatMessage({
            id: 'ImportObservationsWizard.ContextStep.observationNamePlaceholder'
          })}
          value={context.observationName || ''}
          onChange={handleObservationNameChange}
          size="small"
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { maxLength: TEXT_FIELD_MAX_LENGTH } }}
          data-testid="observation-name-field"
        />
        <Box sx={{ minWidth: 160 }}>
          <LanguageSelect
            value={documentLanguage || '000'}
            onChange={handleLanguageChange}
            required
          />
        </Box>
      </Box>

      {/* Authors */}
      <Box sx={{ maxWidth: 480 }}>
        <AuthorsSelect
          value={selectedAuthors}
          onChange={handleAuthorsChange}
          label={formatMessage({ id: 'ImportObservationsWizard.ContextStep.authorsLabel' })}
          noOptionsText={formatMessage({
            id: 'ImportObservationsWizard.ContextStep.authorsNoOptions'
          })}
        />
      </Box>

      {/* License selector */}
      <FormControl size="small" sx={{ minWidth: 240, maxWidth: 320 }} required>
        <InputLabel id="license-label">
          {formatMessage({ id: 'ImportObservationsWizard.ContextStep.licenseLabel' })}
        </InputLabel>
        <Select
          labelId="license-label"
          value={context.licenseId !== null ? context.licenseId : ''}
          label={formatMessage({ id: 'ImportObservationsWizard.ContextStep.licenseLabel' })}
          onChange={e => handleFieldChange('licenseId', e.target.value)}
          disabled={licensesLoading}
          data-testid="license-select">
          {allowedLicenses.map(license => (
            <MenuItem key={license.id} value={license.id}>
              {license.name}
            </MenuItem>
          ))}
        </Select>
        {licensesLoading && (
          <FormHelperText>
            {formatMessage({ id: 'ImportObservationsWizard.ContextStep.loadingLicenses' })}
          </FormHelperText>
        )}
      </FormControl>

      {/* Sampling interval — with tooltip */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          variant="filled"
          label={formatMessage({
            id: 'ImportObservationsWizard.ContextStep.samplingIntervalLabel'
          })}
          type="number"
          value={localSamplingInterval}
          onChange={handleSamplingIntervalChange}
          size="small"
          sx={{ width: 200 }}
          inputProps={{ min: 1 }}
          data-testid="sampling-interval-field"
        />
        <Tooltip
          title={formatMessage({
            id: 'ImportObservationsWizard.ContextStep.samplingIntervalHelper'
          })}
          placement="right">
          <HelpOutlineIcon fontSize="small" color="action" />
        </Tooltip>
      </Box>

      {/* Optional fields */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {formatMessage({ id: 'ImportObservationsWizard.ContextStep.optionalFieldsTitle' })}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
          {/* Data quality */}
          <FormControl size="small" sx={{ minWidth: 200, maxWidth: 240 }}>
            <InputLabel id="data-quality-label">
              {formatMessage({ id: 'ImportObservationsWizard.ContextStep.dataQuality' })}
            </InputLabel>
            <Select
              labelId="data-quality-label"
              value={context.dataQuality || 'raw'}
              label={formatMessage({
                id: 'ImportObservationsWizard.ContextStep.dataQuality'
              })}
              onChange={e => handleFieldChange('dataQuality', e.target.value)}
              data-testid="data-quality-select">
              {DATA_QUALITY_OPTIONS.map(q => (
                <MenuItem key={q} value={q}>
                  {formatMessage({
                    id: `ImportObservationsWizard.ContextStep.dataQuality.${q}`
                  })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

ContextStep.propTypes = {
  initialCaveId: PropTypes.number,
  caveIdLocked: PropTypes.bool
};

export default ContextStep;
