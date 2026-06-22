import reducer, { initialState } from '../ImportWizardReducer';
import {
  SET_ENCODING,
  RESET_WIZARD,
  SET_DEVICES,
  SET_CONFIRMED_DEVICE,
  CLEAR_CONFIRMED_DEVICE,
  FETCH_SENSOR_CONFIGS,
  FETCH_SENSOR_CONFIGS_SUCCESS,
  FETCH_SENSOR_CONFIGS_FAILURE,
  CREATE_SENSOR_CONFIG_SUCCESS,
  SUBMIT_OBSERVATIONS_IMPORT,
  SUBMIT_OBSERVATIONS_IMPORT_SUCCESS,
  SUBMIT_OBSERVATIONS_IMPORT_FAILURE
} from '../../actions/Observations/importWizard';

describe('ImportWizardReducer', () => {
  // Requirements: 12.1
  it('should return the initial state when called with undefined state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  it('should have the correct initial state shape', () => {
    expect(initialState).toMatchObject({
      currentStep: 0,
      file: null,
      rawRows: [],
      encoding: 'UTF-8',
      headerRow: 0,
      skipLastRows: 0,
      numberLocale: 'en',
      confirmedDevice: null,
      deviceSearchResults: [],
      sensorConfigs: [],
      sensorConfigsLoading: false,
      sensorConfigsError: null,
      columnMappings: [],
      validationResult: null,
      samplingIntervalSeconds: null,
      context: {
        locationMode: 'pointAndCave',
        unknownCoordinates: true,
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
    });
  });

  // Requirements: 12.2
  it('should handle SET_ENCODING by updating encoding and leaving other fields unchanged', () => {
    const stateWithData = {
      ...initialState,
      currentStep: 2,
      rawRows: [['col1', 'col2']],
      headerRow: 1
    };
    const state = reducer(stateWithData, {
      type: SET_ENCODING,
      encoding: 'windows-1252'
    });
    expect(state.encoding).toBe('windows-1252');
    expect(state.currentStep).toBe(2);
    expect(state.rawRows).toEqual([['col1', 'col2']]);
    expect(state.headerRow).toBe(1);
  });

  // Requirements: 12.2, 9.4
  it('should handle RESET_WIZARD by restoring initialState including new fields', () => {
    const dirtyState = {
      ...initialState,
      currentStep: 3,
      encoding: 'UTF-16',
      rawRows: [['a', 'b'], ['1', '2']],
      confirmedDevice: { id: 1, name: 'Sensor A' },
      deviceSearchResults: [{ id: 1, name: 'Sensor A' }],
      sensorConfigs: [{ id: 'abc', deviceId: 1 }],
      sensorConfigsLoading: true,
      sensorConfigsError: 'some error',
      submission: { status: 'FAILED', error: 'Network error', documentId: null }
    };
    const state = reducer(dirtyState, { type: RESET_WIZARD });
    expect(state).toEqual(initialState);
    expect(state.confirmedDevice).toBeNull();
    expect(state.deviceSearchResults).toEqual([]);
    expect(state.sensorConfigs).toEqual([]);
    expect(state.sensorConfigsLoading).toBe(false);
    expect(state.sensorConfigsError).toBeNull();
  });

  // Requirements: 9.1
  describe('SET_DEVICES', () => {
    it('should store search results in deviceSearchResults', () => {
      const devices = [
        { id: 1, name: 'Device A' },
        { id: 2, name: 'Device B' }
      ];
      const state = reducer(initialState, { type: SET_DEVICES, devices });
      expect(state.deviceSearchResults).toEqual(devices);
    });

    it('should not affect other state fields', () => {
      const stateWithConfirmedDevice = {
        ...initialState,
        confirmedDevice: { id: 5, name: 'My Device' }
      };
      const state = reducer(stateWithConfirmedDevice, {
        type: SET_DEVICES,
        devices: [{ id: 1, name: 'Result' }]
      });
      expect(state.confirmedDevice).toEqual({ id: 5, name: 'My Device' });
    });
  });

  // Requirements: 9.1
  describe('SET_CONFIRMED_DEVICE', () => {
    it('should set confirmedDevice and reset sensor configs', () => {
      const device = {
        id: 1,
        name: 'TinyTag',
        brand: 'Gemini',
        productUrl: null,
        manufacturerUrl: null,
        ownerId: 42
      };
      const stateWithConfigs = {
        ...initialState,
        sensorConfigs: [{ id: 'old-config', deviceId: 99 }],
        sensorConfigsError: 'previous error'
      };
      const state = reducer(stateWithConfigs, {
        type: SET_CONFIRMED_DEVICE,
        device
      });
      expect(state.confirmedDevice).toEqual(device);
      expect(state.sensorConfigs).toEqual([]);
      expect(state.sensorConfigsError).toBeNull();
    });

    it('should not affect sensorConfigsLoading', () => {
      const stateLoading = {
        ...initialState,
        sensorConfigsLoading: true
      };
      const state = reducer(stateLoading, {
        type: SET_CONFIRMED_DEVICE,
        device: { id: 1, name: 'Device' }
      });
      // sensorConfigsLoading is not explicitly reset by SET_CONFIRMED_DEVICE
      expect(state.sensorConfigsLoading).toBe(true);
    });
  });

  // Requirements: 9.5
  describe('CLEAR_CONFIRMED_DEVICE', () => {
    it('should clear confirmedDevice, sensorConfigs, loading, and error', () => {
      const stateWithDevice = {
        ...initialState,
        confirmedDevice: { id: 1, name: 'Device' },
        sensorConfigs: [{ id: 'cfg1' }, { id: 'cfg2' }],
        sensorConfigsLoading: true,
        sensorConfigsError: 'some error'
      };
      const state = reducer(stateWithDevice, { type: CLEAR_CONFIRMED_DEVICE });
      expect(state.confirmedDevice).toBeNull();
      expect(state.sensorConfigs).toEqual([]);
      expect(state.sensorConfigsLoading).toBe(false);
      expect(state.sensorConfigsError).toBeNull();
    });

    it('should not affect other state fields', () => {
      const stateWithData = {
        ...initialState,
        currentStep: 2,
        confirmedDevice: { id: 1, name: 'Device' },
        deviceSearchResults: [{ id: 1, name: 'Device' }]
      };
      const state = reducer(stateWithData, { type: CLEAR_CONFIRMED_DEVICE });
      expect(state.currentStep).toBe(2);
      expect(state.deviceSearchResults).toEqual([{ id: 1, name: 'Device' }]);
    });
  });

  // Requirements: 9.2
  describe('FETCH_SENSOR_CONFIGS', () => {
    it('should set sensorConfigsLoading to true and clear error', () => {
      const stateWithError = {
        ...initialState,
        sensorConfigsError: 'previous error'
      };
      const state = reducer(stateWithError, { type: FETCH_SENSOR_CONFIGS });
      expect(state.sensorConfigsLoading).toBe(true);
      expect(state.sensorConfigsError).toBeNull();
    });

    it('should preserve existing sensorConfigs during loading', () => {
      const stateWithConfigs = {
        ...initialState,
        sensorConfigs: [{ id: 1, quantityKindCode: 'Temperature' }]
      };
      const state = reducer(stateWithConfigs, { type: FETCH_SENSOR_CONFIGS });
      expect(state.sensorConfigs).toEqual([
        { id: 1, quantityKindCode: 'Temperature' }
      ]);
    });
  });

  // Requirements: 9.2
  describe('FETCH_SENSOR_CONFIGS_SUCCESS', () => {
    it('should set sensorConfigs and clear loading', () => {
      const configs = [
        { id: 1, deviceId: 5, quantityKindCode: 'Temperature', unitSymbol: '°C' },
        { id: 2, deviceId: 5, quantityKindCode: 'RelativeHumidity', unitSymbol: '%' }
      ];
      const loadingState = {
        ...initialState,
        sensorConfigsLoading: true
      };
      const state = reducer(loadingState, {
        type: FETCH_SENSOR_CONFIGS_SUCCESS,
        sensorConfigs: configs
      });
      expect(state.sensorConfigsLoading).toBe(false);
      expect(state.sensorConfigs).toEqual(configs);
    });

    it('should replace existing sensorConfigs entirely', () => {
      const stateWithOldConfigs = {
        ...initialState,
        sensorConfigsLoading: true,
        sensorConfigs: [{ id: 99, quantityKindCode: 'old' }]
      };
      const newConfigs = [{ id: 1, quantityKindCode: 'new' }];
      const state = reducer(stateWithOldConfigs, {
        type: FETCH_SENSOR_CONFIGS_SUCCESS,
        sensorConfigs: newConfigs
      });
      expect(state.sensorConfigs).toEqual(newConfigs);
    });
  });

  // Requirements: 9.2
  describe('FETCH_SENSOR_CONFIGS_FAILURE', () => {
    it('should set error and clear loading', () => {
      const loadingState = {
        ...initialState,
        sensorConfigsLoading: true
      };
      const state = reducer(loadingState, {
        type: FETCH_SENSOR_CONFIGS_FAILURE,
        error: 'Network error'
      });
      expect(state.sensorConfigsLoading).toBe(false);
      expect(state.sensorConfigsError).toBe('Network error');
    });

    it('should preserve existing sensorConfigs on failure', () => {
      const stateWithConfigs = {
        ...initialState,
        sensorConfigsLoading: true,
        sensorConfigs: [{ id: 1, quantityKindCode: 'Temperature' }]
      };
      const state = reducer(stateWithConfigs, {
        type: FETCH_SENSOR_CONFIGS_FAILURE,
        error: 'Timeout'
      });
      expect(state.sensorConfigs).toEqual([
        { id: 1, quantityKindCode: 'Temperature' }
      ]);
    });
  });

  // Requirements: 9.3
  describe('CREATE_SENSOR_CONFIG_SUCCESS', () => {
    it('should append the new config to sensorConfigs', () => {
      const existingConfigs = [
        { id: 1, quantityKindCode: 'Temperature', unitSymbol: '°C' }
      ];
      const stateWithConfigs = {
        ...initialState,
        sensorConfigs: existingConfigs
      };
      const newConfig = {
        id: 2,
        quantityKindCode: 'RelativeHumidity',
        unitSymbol: '%'
      };
      const state = reducer(stateWithConfigs, {
        type: CREATE_SENSOR_CONFIG_SUCCESS,
        sensorConfig: newConfig
      });
      expect(state.sensorConfigs).toEqual([...existingConfigs, newConfig]);
      expect(state.sensorConfigs).toHaveLength(2);
    });

    it('should append to an empty list', () => {
      const newConfig = { id: 1, quantityKindCode: 'pH', unitSymbol: 'pH' };
      const state = reducer(initialState, {
        type: CREATE_SENSOR_CONFIG_SUCCESS,
        sensorConfig: newConfig
      });
      expect(state.sensorConfigs).toEqual([newConfig]);
    });
  });

  // Requirements: 12.3
  it('should handle SUBMIT_OBSERVATIONS_IMPORT by setting submission.status to LOADING', () => {
    const state = reducer(initialState, { type: SUBMIT_OBSERVATIONS_IMPORT });
    expect(state.submission).toEqual({
      status: 'LOADING',
      error: null,
      documentId: null
    });
  });

  it('should handle SUBMIT_OBSERVATIONS_IMPORT without altering other fields', () => {
    const stateWithData = { ...initialState, currentStep: 5, encoding: 'UTF-16' };
    const state = reducer(stateWithData, { type: SUBMIT_OBSERVATIONS_IMPORT });
    expect(state.currentStep).toBe(5);
    expect(state.encoding).toBe('UTF-16');
  });

  // Requirements: 12.3
  it('should handle SUBMIT_OBSERVATIONS_IMPORT_SUCCESS by storing documentId', () => {
    const loadingState = {
      ...initialState,
      submission: { status: 'LOADING', error: null, documentId: null }
    };
    const state = reducer(loadingState, {
      type: SUBMIT_OBSERVATIONS_IMPORT_SUCCESS,
      documentId: 42
    });
    expect(state.submission).toEqual({
      status: 'SUCCEEDED',
      error: null,
      documentId: 42
    });
  });

  // Requirements: 12.4
  it('should handle SUBMIT_OBSERVATIONS_IMPORT_FAILURE by storing the error message', () => {
    const loadingState = {
      ...initialState,
      submission: { status: 'LOADING', error: null, documentId: null }
    };
    const errorMessage = 'Network request failed';
    const state = reducer(loadingState, {
      type: SUBMIT_OBSERVATIONS_IMPORT_FAILURE,
      error: errorMessage
    });
    expect(state.submission).toEqual({
      status: 'FAILED',
      error: errorMessage,
      documentId: null
    });
  });

  it('should return current state for unknown actions', () => {
    const state = reducer(initialState, { type: 'UNKNOWN_ACTION' });
    expect(state).toBe(initialState);
  });
});
