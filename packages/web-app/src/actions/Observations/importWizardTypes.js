// Action type constants for the observation-import wizard.
//
// Split from the thunks so that ImportWizardReducer (imported by the store,
// which is imported by conf/queryClient) never pulls the thunk file — and the
// thunks are free to import queryClient without creating a cycle.

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
