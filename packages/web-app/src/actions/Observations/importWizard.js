import {
  observationsImportUrl,
  devicesUrl,
  devicesSearchUrl,
  getDeviceUrl,
  deviceConfigurationsUrl,
  getCaveUrl,
  getCaverUrl
} from '../../conf/apiRoutes';
import { makeUrl } from '../utils';
import { postLogout } from '../Login';
import queryClient, { STALE } from '../../conf/queryClient';
import { apiGet, apiPost, apiPostForm } from '../../api/client';
import { caveKeys, personKeys } from '../../api/queryKeys';
import { detectEncoding } from '../../components/appli/ImportObservationsWizard/utils/encodingDetector';
import { parseFile } from '../../components/appli/ImportObservationsWizard/utils/csvParser';
import {
  SET_FILE,
  SET_ENCODING,
  SET_RAW_ROWS,
  SET_DEVICES,
  FETCH_SENSOR_CONFIGS,
  FETCH_SENSOR_CONFIGS_SUCCESS,
  FETCH_SENSOR_CONFIGS_FAILURE,
  CREATE_SENSOR_CONFIG,
  CREATE_SENSOR_CONFIG_SUCCESS,
  CREATE_SENSOR_CONFIG_FAILURE,
  SUBMIT_OBSERVATIONS_IMPORT,
  SUBMIT_OBSERVATIONS_IMPORT_SUCCESS,
  SUBMIT_OBSERVATIONS_IMPORT_FAILURE
} from './importWizardTypes';

// Action type constants live in ./importWizardTypes so ImportWizardReducer
// can import them without dragging in the thunks (which would create a
// cycle through queryClient → store → GCReducer → ImportWizardReducer).
// Re-exported here so existing importers of `SET_CONTEXT` etc. keep working.
export * from './importWizardTypes';

// The wizard submission thunks stay thunks (they own reducer-side status
// tracking that the multi-step UI reads back), but the fetch layer moves to
// apiGet/apiPost so we can share the auth-header, 401 shape and error
// contract with the rest of the app. This tiny helper mirrors what the
// QueryClient's global onError does for RQ paths — one place, one 401
// behaviour, across both paradigms.
const handleAuthError = (error, dispatch) => {
  if (error?.status === 401) {
    dispatch(postLogout());
    return true;
  }
  return false;
};

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
  idSubstance: config.substance?.id ?? null,
  substanceName: config.substance?.name ?? null,
  precisionUpper:
    config.precisionUpper != null ? Number(config.precisionUpper) : null,
  precisionLower:
    config.precisionLower != null ? Number(config.precisionLower) : null,
  resolution: config.resolution != null ? Number(config.resolution) : null,
  detectionLimitMin:
    config.detectionLimitMin != null ? Number(config.detectionLimitMin) : null,
  detectionLimitMax:
    config.detectionLimitMax != null ? Number(config.detectionLimitMax) : null
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

export const searchDevices =
  (query, { filter, sort = 'name:asc' } = {}) =>
  async dispatch => {
    const params = { sort };
    if (query) params.query = query;
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        params[`filter[${key}]`] = value;
      });
    }
    try {
      const data = await apiGet(makeUrl(devicesSearchUrl, params));
      const devices = (data.results || []).map(normalizeSearchDevice);
      dispatch({ type: SET_DEVICES, devices });
      return devices;
    } catch (error) {
      if (handleAuthError(error, dispatch)) return undefined;
      console.error('Device search failed:', error.message);
      throw error;
    }
  };

export const createDevice = deviceData => async dispatch => {
  const body = {
    name: deviceData.name,
    brandName: deviceData.brandName || undefined,
    serialNumber: deviceData.serialNumber || undefined,
    productUrl: deviceData.productUrl || undefined,
    manufacturerUrl: deviceData.manufacturerUrl || undefined
  };
  try {
    const data = await apiPost(devicesUrl, body);
    return normalizeDevice(data);
  } catch (error) {
    if (handleAuthError(error, dispatch)) return undefined;
    console.error('Device creation failed:', error.message);
    throw error;
  }
};

export const fetchSensorConfigs = deviceId => async dispatch => {
  dispatch({ type: FETCH_SENSOR_CONFIGS });
  try {
    const data = await apiGet(getDeviceUrl(deviceId));
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
  } catch (error) {
    if (handleAuthError(error, dispatch)) return undefined;
    dispatch({
      type: FETCH_SENSOR_CONFIGS_FAILURE,
      error: error.message
    });
    return undefined;
  }
};

export const createSensorConfig = configData => async dispatch => {
  dispatch({ type: CREATE_SENSOR_CONFIG });
  const body = {
    label: configData.label || undefined,
    quantityKind: configData.quantityKindId,
    unit: configData.unitId,
    ...(configData.idSubstance != null && {
      idSubstance: configData.idSubstance
    }),
    precisionUpper: configData.precisionUpper ?? null,
    precisionLower: configData.precisionLower ?? null,
    resolution: configData.resolution ?? null,
    detectionLimitMin: configData.detectionLimitMin ?? null,
    detectionLimitMax: configData.detectionLimitMax ?? null
  };
  try {
    const data = await apiPost(
      deviceConfigurationsUrl(configData.deviceId),
      body
    );
    const sensorConfig = normalizeSensorConfig(data);
    dispatch({ type: CREATE_SENSOR_CONFIG_SUCCESS, sensorConfig });
    return sensorConfig;
  } catch (error) {
    if (handleAuthError(error, dispatch)) return undefined;
    dispatch({
      type: CREATE_SENSOR_CONFIG_FAILURE,
      error: error.message
    });
    throw error;
  }
};

export const submitObservationsImport =
  (file, profileJson) => async dispatch => {
    dispatch({ type: SUBMIT_OBSERVATIONS_IMPORT });

    // apiPostForm intentionally does NOT set Content-Type — the browser sets
    // it to multipart/form-data with the correct boundary.
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profile', JSON.stringify(profileJson));

    try {
      const data = await apiPostForm(observationsImportUrl, formData);
      dispatch({
        type: SUBMIT_OBSERVATIONS_IMPORT_SUCCESS,
        documentId: data.documentId
      });
      return data;
    } catch (error) {
      if (handleAuthError(error, dispatch)) return undefined;
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
      return undefined;
    }
  };

// Both lookups piggy-back on the shared RQ cache (caveKeys.detail /
// personKeys.detail) so a cave already loaded by useCave / a caver by usePerson
// is reused here without an extra request. The thunk signature is preserved
// (`dispatch(fetchCaveById(id))`) so wizard callers do not change.
//
// The optional `signal` argument is dropped: RQ handles in-flight
// deduplication and cache reuse; the wizard's cancelled/AbortController flags
// still gate the state updates on the caller side.
export const fetchCaveById = caveId => async () => {
  try {
    return await queryClient.fetchQuery({
      queryKey: caveKeys.detail(caveId),
      queryFn: () => apiGet(`${getCaveUrl}${caveId}`),
      staleTime: STALE.STANDARD
    });
  } catch (error) {
    // 401s are dispatched to postLogout by the QueryClient's global onError,
    // so this catch only sees non-auth errors — same graceful degradation as
    // the legacy thunk (log and return undefined).
    console.error(`Failed to fetch cave ${caveId}:`, error.message);
    return undefined;
  }
};

export const fetchCaverById = caverId => async () => {
  try {
    return await queryClient.fetchQuery({
      queryKey: personKeys.detail(caverId),
      queryFn: () => apiGet(`${getCaverUrl}${caverId}`),
      staleTime: STALE.STANDARD
    });
  } catch (error) {
    console.error(`Failed to fetch caver ${caverId}:`, error.message);
    return undefined;
  }
};
