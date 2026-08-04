import { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

import { useDebounce } from '../../../../hooks';
import {
  searchDevices,
  createDevice,
  fetchSensorConfigs,
  SET_DEVICES,
  SET_CONFIRMED_DEVICE,
  UPDATE_CONFIRMED_DEVICE,
  CLEAR_CONFIRMED_DEVICE
} from '../../../../actions/Observations/importWizard';
import {
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  AUTOCOMPLETE_MIN_CHARACTERS
} from '../../../../conf/config';
import SensorConfigList from './SensorConfigList';
import SensorConfigForm from './SensorConfigForm';

// ─── DeviceSelector ──────────────────────────────────────────────────────────

const DeviceSelector = ({ disabled, onCreateNew, onSelect }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const devices = useSelector(state => state.importWizard.deviceSearchResults);
  const currentUserId = useSelector(state => state.login.authTokenDecoded?.id);

  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [myDevicesOnly, setMyDevicesOnly] = useState(true);

  const debouncedInput = useDebounce(inputValue, AUTOCOMPLETE_DEBOUNCE_DELAY);

  const getFilter = useCallback(
    () =>
      myDevicesOnly && currentUserId
        ? { authorId: String(currentUserId) }
        : undefined,
    [myDevicesOnly, currentUserId]
  );

  // Fetch on typed input or when filter changes
  useEffect(() => {
    if (disabled) return undefined;
    const query = debouncedInput ? debouncedInput.trim() : '';
    if (!query || query.length < AUTOCOMPLETE_MIN_CHARACTERS) return undefined;
    let cancelled = false;
    setIsSearching(true);
    dispatch(searchDevices(query, { filter: getFilter() }))
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedInput, dispatch, disabled, getFilter]);

  // Fetch on open or when checkbox is checked (no typed query)
  useEffect(() => {
    if (disabled) return undefined;
    if (!myDevicesOnly) return undefined;
    const query = debouncedInput ? debouncedInput.trim() : '';
    if (query.length >= AUTOCOMPLETE_MIN_CHARACTERS) return undefined;
    let cancelled = false;
    setIsSearching(true);
    dispatch(searchDevices('', { filter: getFilter() }))
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
    // Excluding debouncedInput — this effect only runs when myDevicesOnly
    // changes or on initial load without a typed query.
  }, [myDevicesOnly, dispatch, disabled, getFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = useCallback(() => {
    if (disabled || !myDevicesOnly || devices.length > 0) return;
    setIsSearching(true);
    dispatch(searchDevices('', { filter: getFilter() }))
      .catch(() => {})
      .finally(() => setIsSearching(false));
  }, [disabled, myDevicesOnly, devices.length, dispatch, getFilter]);

  const CREATE_NEW_OPTION = {
    __isCreateNew: true,
    id: '__create_new__',
    name: formatMessage({
      id: 'ImportObservationsWizard.DeviceSensorsStep.createNewDevice'
    })
  };

  const options =
    inputValue.trim().length >= AUTOCOMPLETE_MIN_CHARACTERS ||
    devices.length > 0
      ? [...devices, CREATE_NEW_OPTION]
      : [CREATE_NEW_OPTION];

  const handleInputChange = useCallback((_e, newInput, reason) => {
    if (reason === 'reset') return;
    setInputValue(newInput);
  }, []);

  const handleChange = useCallback(
    (_e, selected) => {
      if (selected && selected.__isCreateNew) {
        onCreateNew();
        return;
      }
      if (selected) {
        onSelect(selected);
      }
    },
    [onCreateNew, onSelect]
  );

  const handleMyDevicesToggle = useCallback(
    e => {
      setMyDevicesOnly(e.target.checked);
      if (!e.target.checked) {
        dispatch({ type: SET_DEVICES, devices: [] });
      }
    },
    [dispatch]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={myDevicesOnly}
            onChange={handleMyDevicesToggle}
            size="small"
            data-testid="my-devices-only-checkbox"
          />
        }
        label={formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.myDevicesOnly'
        })}
      />
      <Autocomplete
        disabled={disabled}
        options={options}
        getOptionLabel={option => option.name || ''}
        filterOptions={x => x}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onOpen={handleOpen}
        value={null}
        onChange={handleChange}
        loading={isSearching}
        slotProps={{ popper: { 'data-testid': 'device-search-popper' } }}
        isOptionEqualToValue={(opt, val) =>
          opt.id !== undefined && val.id !== undefined
            ? String(opt.id) === String(val.id)
            : opt === val
        }
        renderOption={(props, option) => {
          // MUI hands `key` inside renderOption's props bag and React 19 requires
          // extracting it before the spread; this callback is not a component.
          // eslint-disable-next-line react/prop-types
          const { key, ...rest } = props;
          if (option.__isCreateNew) {
            return (
              <li key="create-new" {...rest}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AddIcon fontSize="small" color="primary" />
                  <Typography color="primary">{option.name}</Typography>
                </Box>
              </li>
            );
          }
          return (
            <li key={key || option.id} {...rest}>
              <Box>
                <Typography variant="body2">{option.name}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {option.brandName && (
                    <Typography variant="caption" color="text.secondary">
                      {option.brandName}
                    </Typography>
                  )}
                  {option.serialNumber && (
                    <Typography variant="caption" color="text.secondary">
                      {option.brandName ? '·' : ''} S/N: {option.serialNumber}
                    </Typography>
                  )}
                  {option.author && option.author.nickname && (
                    <Typography variant="caption" color="text.secondary">
                      {option.brandName || option.serialNumber ? '·' : ''}{' '}
                      {formatMessage(
                        {
                          id: 'ImportObservationsWizard.DeviceSensorsStep.deviceAuthor'
                        },
                        { nickname: option.author.nickname }
                      )}
                    </Typography>
                  )}
                </Box>
              </Box>
            </li>
          );
        }}
        renderInput={params => (
          <TextField
            {...params}
            label={formatMessage({
              id: 'ImportObservationsWizard.DeviceSensorsStep.searchDevice'
            })}
            placeholder={formatMessage({
              id: 'ImportObservationsWizard.DeviceSensorsStep.searchDevicePlaceholder'
            })}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isSearching && <CircularProgress size={18} />}
                    {params.InputProps.endAdornment}
                  </>
                )
              }
            }}
            data-testid="device-search-input"
          />
        )}
        data-testid="device-selector"
      />
    </Box>
  );
};

DeviceSelector.propTypes = {
  disabled: PropTypes.bool,
  onCreateNew: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};

// ─── DeviceCreator ───────────────────────────────────────────────────────────

const DeviceCreator = ({ onCancel, onSuccess }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: '',
    brandName: '',
    serialNumber: '',
    productUrl: '',
    manufacturerUrl: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const setField = useCallback(
    field => e => setForm(prev => ({ ...prev, [field]: e.target.value })),
    []
  );

  const isNameValid = form.name.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!isNameValid) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await dispatch(createDevice(form));
      if (created) {
        onSuccess(created);
      }
    } catch (err) {
      setCreateError(
        err.message ||
          formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.createDeviceError'
          })
      );
    } finally {
      setIsCreating(false);
    }
  }, [dispatch, form, isNameValid, onSuccess, formatMessage]);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1, mt: 1 }}
      data-testid="create-device-form"
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.newDeviceTitle'
        })}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <TextField
          label={formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.deviceName'
          })}
          value={form.name}
          onChange={setField('name')}
          required
          size="small"
          inputProps={{ maxLength: 300 }}
          data-testid="new-device-name"
        />
        <TextField
          label={formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.deviceBrand'
          })}
          value={form.brandName}
          onChange={setField('brandName')}
          size="small"
          inputProps={{ maxLength: 200 }}
          data-testid="new-device-brand"
        />
        <TextField
          label={formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.deviceSerialNumber'
          })}
          value={form.serialNumber}
          onChange={setField('serialNumber')}
          size="small"
          inputProps={{ maxLength: 200 }}
          data-testid="new-device-serial-number"
        />
        <TextField
          label={formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.deviceProductUrl'
          })}
          value={form.productUrl}
          onChange={setField('productUrl')}
          size="small"
          type="url"
          inputProps={{ maxLength: 500 }}
          data-testid="new-device-product-url"
        />
        <TextField
          label={formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.deviceManufacturerUrl'
          })}
          value={form.manufacturerUrl}
          onChange={setField('manufacturerUrl')}
          size="small"
          type="url"
          inputProps={{ maxLength: 500 }}
          data-testid="new-device-manufacturer-url"
        />
      </Box>
      {createError && (
        <Alert
          severity="error"
          sx={{ mt: 1 }}
          data-testid="create-device-error"
        >
          {createError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isNameValid || isCreating}
          size="small"
          data-testid="create-device-submit"
        >
          {isCreating ? (
            <CircularProgress size={18} />
          ) : (
            formatMessage({
              id: 'ImportObservationsWizard.DeviceSensorsStep.createDevice'
            })
          )}
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel}
          size="small"
          data-testid="create-device-cancel"
        >
          {formatMessage({ id: 'ImportObservationsWizard.cancel' })}
        </Button>
      </Box>
    </Paper>
  );
};

DeviceCreator.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

// ─── SelectedDeviceCard ──────────────────────────────────────────────────────

const SelectedDeviceCard = ({ device, onChangeDevice }) => {
  const { formatMessage } = useIntl();

  return (
    <Card variant="outlined" data-testid="selected-device-card">
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography variant="subtitle1">{device.name}</Typography>
          {device.brandName && (
            <Typography variant="body2" color="text.secondary">
              {device.brandName}
            </Typography>
          )}
          {device.serialNumber && (
            <Typography variant="body2" color="text.secondary">
              {formatMessage({
                id: 'ImportObservationsWizard.DeviceSensorsStep.deviceSerialNumber'
              })}
              {': '}
              {device.serialNumber}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          onClick={onChangeDevice}
          data-testid="change-device-button"
        >
          {formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.changeDevice'
          })}
        </Button>
      </CardContent>
    </Card>
  );
};

SelectedDeviceCard.propTypes = {
  device: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    brandName: PropTypes.string,
    serialNumber: PropTypes.string
  }).isRequired,
  onChangeDevice: PropTypes.func.isRequired
};

// ─── DeviceSensorsStep (orchestrator) ────────────────────────────────────────

const DeviceSensorsStep = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const confirmedDevice = useSelector(
    state => state.importWizard.confirmedDevice
  );

  const [showCreator, setShowCreator] = useState(false);

  // When confirmedDevice changes (non-null), fetch sensor configs
  const confirmedDeviceIdRef = useRef(null);
  useEffect(() => {
    let cancelled = false;

    if (
      confirmedDevice &&
      confirmedDevice.id !== confirmedDeviceIdRef.current
    ) {
      confirmedDeviceIdRef.current = confirmedDevice.id;
      dispatch(fetchSensorConfigs(confirmedDevice.id))
        .then(result => {
          if (cancelled) return;
          // Update confirmed device with full info from API if it was a placeholder
          if (result && result.device && !confirmedDevice.name) {
            dispatch({ type: UPDATE_CONFIRMED_DEVICE, device: result.device });
          }
        })
        .catch(() => {
          // Errors are handled by the reducer (FETCH_SENSOR_CONFIGS_FAILURE)
        });
    }
    if (!confirmedDevice) {
      confirmedDeviceIdRef.current = null;
    }

    return () => {
      cancelled = true;
      confirmedDeviceIdRef.current = null;
    };
  }, [confirmedDevice, dispatch]);

  const handleDeviceSelect = useCallback(
    device => {
      dispatch({ type: SET_CONFIRMED_DEVICE, device });
      setShowCreator(false);
    },
    [dispatch]
  );

  const handleCreateNew = useCallback(() => {
    setShowCreator(true);
  }, []);

  const handleCreateSuccess = useCallback(
    created => {
      dispatch({ type: SET_CONFIRMED_DEVICE, device: created });
      setShowCreator(false);
    },
    [dispatch]
  );

  const handleCancelCreate = useCallback(() => {
    setShowCreator(false);
  }, []);

  const handleChangeDevice = useCallback(() => {
    dispatch({ type: CLEAR_CONFIRMED_DEVICE });
    setShowCreator(false);
  }, [dispatch]);

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      data-testid="device-sensors-step">
      <Typography variant="h3" component="h2">
        {formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.title'
        })}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.description'
        })}
      </Typography>
      {/* Phase 1: Device selection/creation */}
      <Box data-testid="device-phase">
        {confirmedDevice ? (
          <SelectedDeviceCard
            device={confirmedDevice}
            onChangeDevice={handleChangeDevice}
          />
        ) : (
          <>
            <DeviceSelector
              disabled={showCreator}
              onCreateNew={handleCreateNew}
              onSelect={handleDeviceSelect}
            />
            {showCreator && (
              <DeviceCreator
                onCancel={handleCancelCreate}
                onSuccess={handleCreateSuccess}
              />
            )}
          </>
        )}
      </Box>
      {/* Phase 2: Sensor configurations (only when device is confirmed) */}
      {confirmedDevice && (
        <Box data-testid="sensor-config-phase">
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {formatMessage({
              id: 'ImportObservationsWizard.DeviceSensorsStep.sensorConfigPhaseTitle'
            })}
          </Typography>
          <SensorConfigList deviceId={confirmedDevice.id} />
          <Box sx={{ mt: 1 }}>
            <SensorConfigForm deviceId={confirmedDevice.id} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DeviceSensorsStep;
