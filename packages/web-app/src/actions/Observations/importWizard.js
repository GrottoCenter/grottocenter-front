import fetch from 'isomorphic-fetch';
import {
  observationsImportUrl,
  devicesUrl,
  devicesSearchUrl,
  getDeviceUrl,
  deviceConfigurationsUrl,
  getCaveUrl,
  getCaverUrl
} from '../../conf/apiRoutes';
import { checkAuthStatus, makeUrl } from '../utils';
import { detectEncoding } from '../../components/appli/ImportObservationsWizard/utils/encodingDetector';
import { parseFile } from '../../components/appli/ImportObservationsWizard/utils/csvParser';

// ===== Wizard navigation
export const SET_WIZARD_STEP = 'SET_WIZARD_STEP';
export const RESET_WIZARD = 'RESET_WIZARD';

// ===== Upload step
export const SET_FILE = 'SET_FILE';
export const SET_PROFILE_FILE_NAME = 'SET_PROFILE_FILE_NAME';
export const SET_ENCODING = 'SET_ENCODING';
export const SET_RAW_ROWS = 'SET_RAW_ROWS';
export const SET_HEADER_ROW = 'SET_HEADER_ROW';
export const SET_SKIP_LAST_ROWS = 'SET_SKIP_LAST_ROWS';
export const SET_SKIP_FIRST_ROWS = 'SET_SKIP_FIRST_ROWS';
export const SET_NUMBER_LOCALE = 'SET_NUMBER_LOCALE';
export const SET_DOCUMENT_LANGUAGE = 'SET_DOCUMENT_LANGUAGE';

// ===== Device & Sensors step
export const SET_DEVICES = 'SET_DEVICES';
export const UPDATE_SENSOR_CONFIG = 'UPDATE_SENSOR_CONFIG';
export const SET_CONFIRMED_DEVICE = 'SET_CONFIRMED_DEVICE';
export const UPDATE_CONFIRMED_DEVICE = 'UPDATE_CONFIRMED_DEVICE';
export const CLEAR_CONFIRMED_DEVICE = 'CLEAR_CONFIRMED_DEVICE';
export const FETCH_SENSOR_CONFIGS = 'FETCH_SENSOR_CONFIGS';
export const FETCH_SENSOR_CONFIGS_SUCCESS = 'FETCH_SENSOR_CONFIGS_SUCCESS';
export const FETCH_SENSOR_CONFIGS_FAILURE = 'FETCH_SENSOR_CONFIGS_FAILURE';
export const CREATE_SENSOR_CONFIG = 'CREATE_SENSOR_CONFIG';
export const CREATE_SENSOR_CONFIG_SUCCESS = 'CREATE_SENSOR_CONFIG_SUCCESS';
export const CREATE_SENSOR_CONFIG_FAILURE = 'CREATE_SENSOR_CONFIG_FAILURE';

// ===== Map Columns step
export const SET_COLUMN_MAPPINGS = 'SET_COLUMN_MAPPINGS';
export const UPDATE_COLUMN_MAPPING = 'UPDATE_COLUMN_MAPPING';

// ===== Validate step
export const SET_VALIDATION_RESULT = 'SET_VALIDATION_RESULT';
export const SET_SAMPLING_INTERVAL = 'SET_SAMPLING_INTERVAL';

// ===== Context step
export const SET_CONTEXT = 'SET_CONTEXT';

// ===== Submission
export const SUBMIT_OBSERVATIONS_IMPORT = 'SUBMIT_OBSERVATIONS_IMPORT';
export const SUBMIT_OBSERVATIONS_IMPORT_SUCCESS =
  'SUBMIT_OBSERVATIONS_IMPORT_SUCCESS';
export const SUBMIT_OBSERVATIONS_IMPORT_FAILURE =
  'SUBMIT_OBSERVATIONS_IMPORT_FAILURE';

// ===== Helpers

/**
 * Normalizes a raw sensor configuration from the API (which has nested
 * quantityKind and unit objects) into the shape used internally.
 */
const normalizeSensorConfig = config => ({
  id: config.id,
  deviceId: config.device,
  label: config.label || null,
  quantityKindId: config.quantityKind.id,
  quantityKindCode: config.quantityKind.code,
  unitId: config.unit.id,
  unitSymbol: config.unit.symbol,
  precisionUpper:
    config.precisionUpper != null ? Number(config.precisionUpper) : null,
  precisionLower:
    config.precisionLower != null ? Number(config.precisionLower) : null,
  resolution:
    config.resolution != null ? Number(config.resolution) : null,
  detectionLimitMin:
    config.detectionLimitMin != null
      ? Number(config.detectionLimitMin)
      : null,
  detectionLimitMax:
    config.detectionLimitMax != null
      ? Number(config.detectionLimitMax)
      : null
});

/**
 * Normalizes a device from the search API response into the internal shape.
 * Search results have { id: string, name, brandName, author: { id, nickname } }.
 */
const normalizeSearchDevice = device => ({
  id: device.id != null ? Number(device.id) : null,
  name: device.name || null,
  brandName: device.brandName || null,
  serialNumber: device.serialNumber || null,
  author: device.author || null
});

/**
 * Normalizes a device from the GET/POST device API response.
 * Full device has { id, name, brandName, author: { id, nickname }, configurations }.
 */
const normalizeDevice = device => ({
  id: device.id,
  name: device.name,
  brandName: device.brandName || null,
  serialNumber: device.serialNumber || null,
  author: device.author || null
});

// ===== Thunks

export const parseAndSetFile = (file, encoding) => async dispatch => {
  dispatch({ type: SET_FILE, file });

  const slice = file.slice(0, 4096);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const detectedEncoding = encoding || detectEncoding(bytes);

  dispatch({ type: SET_ENCODING, encoding: detectedEncoding });

  const rawRows = await parseFile(file, detectedEncoding);
  dispatch({ type: SET_RAW_ROWS, rawRows });
};

export const searchDevices = (query, { filter, sort = 'name:asc' } = {}) => (dispatch, getState) => {
  const { authorizationHeader } = getState().login;
  const params = { sort };
  if (query) params.query = query;
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      params[`filter[${key}]`] = value;
    });
  }
  const url = makeUrl(devicesSearchUrl, params);

  const requestOptions = {
    method: 'GET',
    headers: authorizationHeader
  };

  return fetch(url, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => {
      const devices = (data.results || []).map(normalizeSearchDevice);
      dispatch({ type: SET_DEVICES, devices });
      return devices;
    })
    .catch(error => {
      if (error.isAuthError) return;
      // Logging for debugging — the error is re-thrown for caller handling
      // eslint-disable-next-line no-console
      console.error('Device search failed:', error.message);
      throw error;
    });
};

export const createDevice = deviceData => (dispatch, getState) => {
  const { authorizationHeader } = getState().login;

  const body = {
    name: deviceData.name,
    brandName: deviceData.brandName || undefined,
    serialNumber: deviceData.serialNumber || undefined,
    productUrl: deviceData.productUrl || undefined,
    manufacturerUrl: deviceData.manufacturerUrl || undefined
  };

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      ...authorizationHeader,
      'Content-Type': 'application/json'
    }
  };

  return fetch(devicesUrl, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => normalizeDevice(data))
    .catch(error => {
      if (error.isAuthError) return;
      // eslint-disable-next-line no-console
      console.error('Device creation failed:', error.message);
      throw error;
    });
};

export const fetchSensorConfigs = deviceId => (dispatch, getState) => {
  dispatch({ type: FETCH_SENSOR_CONFIGS });
  const { authorizationHeader } = getState().login;

  const requestOptions = {
    method: 'GET',
    headers: authorizationHeader
  };

  return fetch(getDeviceUrl(deviceId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => {
      const sensorConfigs = (data.configurations || []).map(
        normalizeSensorConfig
      );
      dispatch({ type: FETCH_SENSOR_CONFIGS_SUCCESS, sensorConfigs });

      // Return full device data so caller can update confirmed device if needed
      return {
        device: {
          id: data.id,
          name: data.name,
          brandName: data.brandName || null,
          serialNumber: data.serialNumber || null,
          author: data.author || null
        },
        sensorConfigs
      };
    })
    .catch(error => {
      if (error.isAuthError) return;
      dispatch({
        type: FETCH_SENSOR_CONFIGS_FAILURE,
        error: error.message
      });
    });
};

export const createSensorConfig = configData => (dispatch, getState) => {
  dispatch({ type: CREATE_SENSOR_CONFIG });
  const { authorizationHeader } = getState().login;

  const body = {
    label: configData.label || undefined,
    quantityKind: configData.quantityKindId,
    unit: configData.unitId,
    precisionUpper: configData.precisionUpper ?? null,
    precisionLower: configData.precisionLower ?? null,
    resolution: configData.resolution ?? null,
    detectionLimitMin: configData.detectionLimitMin ?? null,
    detectionLimitMax: configData.detectionLimitMax ?? null
  };

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      ...authorizationHeader,
      'Content-Type': 'application/json'
    }
  };

  return fetch(deviceConfigurationsUrl(configData.deviceId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => {
      const sensorConfig = normalizeSensorConfig(data);
      dispatch({ type: CREATE_SENSOR_CONFIG_SUCCESS, sensorConfig });
      return sensorConfig;
    })
    .catch(error => {
      if (error.isAuthError) return;
      dispatch({
        type: CREATE_SENSOR_CONFIG_FAILURE,
        error: error.message
      });
      throw error;
    });
};

export const submitObservationsImport =
  (file, profileJson) => (dispatch, getState) => {
    dispatch({ type: SUBMIT_OBSERVATIONS_IMPORT });

    const { authorizationHeader } = getState().login;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('profile', JSON.stringify(profileJson));

    // Do NOT set Content-Type — the browser sets it to multipart/form-data
    // with the correct boundary when using FormData.
    const requestOptions = {
      method: 'POST',
      body: formData,
      headers: authorizationHeader
    };

    return fetch(observationsImportUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => {
        dispatch({
          type: SUBMIT_OBSERVATIONS_IMPORT_SUCCESS,
          documentId: data.documentId
        });
        return data;
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch({
          type: SUBMIT_OBSERVATIONS_IMPORT_FAILURE,
          error: {
            code: error.body?.code || null,
            message: error.body?.message || error.message,
            details: error.body?.metadata?.details || [],
            status: error.status || null,
            referenceId: error.body?.reference_id || null
          }
        });
      });
  };

export const fetchCaveById = (caveId, { signal } = {}) => (dispatch, getState) => {
  const { authorizationHeader } = getState().login;

  const requestOptions = {
    method: 'GET',
    headers: authorizationHeader,
    signal
  };

  return fetch(`${getCaveUrl}${caveId}`, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .catch(error => {
      if (error.isAuthError) return undefined;
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch cave ${caveId}:`, error.message);
      return undefined;
    });
};

export const fetchCaverById = (caverId, { signal } = {}) => (dispatch, getState) => {
  const { authorizationHeader } = getState().login;

  const requestOptions = {
    method: 'GET',
    headers: authorizationHeader,
    signal
  };

  return fetch(`${getCaverUrl}${caverId}`, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .catch(error => {
      if (error.isAuthError) return undefined;
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch caver ${caverId}:`, error.message);
      return undefined;
    });
};
