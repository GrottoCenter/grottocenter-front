import {
  SET_WIZARD_STEP,
  RESET_WIZARD,
  SET_FILE,
  SET_PROFILE_FILE_NAME,
  SET_ENCODING,
  SET_RAW_ROWS,
  SET_HEADER_ROW,
  SET_SKIP_LAST_ROWS,
  SET_SKIP_FIRST_ROWS,
  SET_NUMBER_LOCALE,
  SET_DOCUMENT_LANGUAGE,
  SET_DEVICES,
  UPDATE_SENSOR_CONFIG,
  SET_CONFIRMED_DEVICE,
  UPDATE_CONFIRMED_DEVICE,
  CLEAR_CONFIRMED_DEVICE,
  FETCH_SENSOR_CONFIGS,
  FETCH_SENSOR_CONFIGS_SUCCESS,
  FETCH_SENSOR_CONFIGS_FAILURE,
  CREATE_SENSOR_CONFIG_SUCCESS,
  SET_COLUMN_MAPPINGS,
  UPDATE_COLUMN_MAPPING,
  SET_VALIDATION_RESULT,
  SET_SAMPLING_INTERVAL,
  SET_CONTEXT,
  SUBMIT_OBSERVATIONS_IMPORT,
  SUBMIT_OBSERVATIONS_IMPORT_SUCCESS,
  SUBMIT_OBSERVATIONS_IMPORT_FAILURE
} from '../actions/Observations/importWizard';
import { DEFAULT_DOCUMENT_LANGUAGE } from '../components/appli/ImportObservationsWizard/constants/defaults';

export const initialState = {
  currentStep: 0,
  file: null,
  profileFileName: null,
  rawRows: [],
  encoding: 'UTF-8',
  headerRow: 0,
  skipFirstRows: 0,
  skipLastRows: 0,
  numberLocale: 'en',
  documentLanguage: DEFAULT_DOCUMENT_LANGUAGE,
  confirmedDevice: null,
  deviceSearchResults: [],
  sensorConfigs: [],
  sensorConfigsLoading: false,
  sensorConfigsError: null,
  columnMappings: [],
  validationResult: null,
  samplingIntervalSeconds: null,
  context: {
    caveId: null,
    caveIdLocked: false,
    pointLabel: '',
    authorIds: [],
    licenseId: null,
    latitude: null,
    longitude: null,
    observationName: null,
    documentTitle: null,
    dataQuality: 'raw'
  },
  submission: {
    status: 'IDLE',
    error: null,
    documentId: null
  }
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    // Wizard navigation
    case SET_WIZARD_STEP:
      return { ...state, currentStep: action.step };

    case RESET_WIZARD:
      return { ...initialState };

    // Upload step
    case SET_FILE:
      return { ...state, file: action.file };

    case SET_PROFILE_FILE_NAME:
      return { ...state, profileFileName: action.profileFileName };

    case SET_ENCODING:
      return { ...state, encoding: action.encoding };

    case SET_RAW_ROWS:
      return { ...state, rawRows: action.rawRows };

    case SET_HEADER_ROW:
      return { ...state, headerRow: action.headerRow };

    case SET_SKIP_LAST_ROWS:
      return { ...state, skipLastRows: action.skipLastRows };

    case SET_SKIP_FIRST_ROWS:
      return { ...state, skipFirstRows: action.skipFirstRows };

    case SET_NUMBER_LOCALE:
      return { ...state, numberLocale: action.locale };

    case SET_DOCUMENT_LANGUAGE:
      return { ...state, documentLanguage: action.documentLanguage };

    // Device & Sensors step
    case SET_DEVICES:
      return { ...state, deviceSearchResults: action.devices };

    case SET_CONFIRMED_DEVICE:
      return {
        ...state,
        confirmedDevice: action.device,
        sensorConfigs: [],
        sensorConfigsError: null
      };

    case UPDATE_CONFIRMED_DEVICE:
      return {
        ...state,
        confirmedDevice: action.device
      };

    case CLEAR_CONFIRMED_DEVICE:
      return {
        ...state,
        confirmedDevice: null,
        sensorConfigs: [],
        sensorConfigsLoading: false,
        sensorConfigsError: null
      };

    case FETCH_SENSOR_CONFIGS:
      return { ...state, sensorConfigsLoading: true, sensorConfigsError: null };

    case FETCH_SENSOR_CONFIGS_SUCCESS:
      return {
        ...state,
        sensorConfigsLoading: false,
        sensorConfigs: action.sensorConfigs
      };

    case FETCH_SENSOR_CONFIGS_FAILURE:
      return {
        ...state,
        sensorConfigsLoading: false,
        sensorConfigsError: action.error
      };

    case CREATE_SENSOR_CONFIG_SUCCESS:
      return {
        ...state,
        sensorConfigs: [...state.sensorConfigs, action.sensorConfig]
      };

    case UPDATE_SENSOR_CONFIG:
      return {
        ...state,
        sensorConfigs: state.sensorConfigs.map(config =>
          config.id === action.sensorConfig.id ? action.sensorConfig : config
        )
      };

    // Map Columns step
    case SET_COLUMN_MAPPINGS:
      return { ...state, columnMappings: action.columnMappings };

    case UPDATE_COLUMN_MAPPING:
      return {
        ...state,
        columnMappings: state.columnMappings.map(mapping =>
          mapping.columnIndex === action.columnMapping.columnIndex
            ? action.columnMapping
            : mapping
        )
      };

    // Validate step
    case SET_VALIDATION_RESULT:
      return { ...state, validationResult: action.validationResult };

    case SET_SAMPLING_INTERVAL:
      return {
        ...state,
        samplingIntervalSeconds: action.samplingIntervalSeconds
      };

    // Context step
    case SET_CONTEXT:
      return {
        ...state,
        context: { ...state.context, ...action.context }
      };

    // Submission
    case SUBMIT_OBSERVATIONS_IMPORT:
      return {
        ...state,
        submission: { status: 'LOADING', error: null, documentId: null }
      };

    case SUBMIT_OBSERVATIONS_IMPORT_SUCCESS:
      return {
        ...state,
        submission: {
          status: 'SUCCEEDED',
          error: null,
          documentId: action.documentId
        }
      };

    case SUBMIT_OBSERVATIONS_IMPORT_FAILURE:
      return {
        ...state,
        submission: {
          status: 'FAILED',
          error: action.error,
          documentId: null
        }
      };

    default:
      return state;
  }
};

export default reducer;
