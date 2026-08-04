import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import DeviceSensorsStep from './DeviceSensorsStep';
import { fetchSensorConfigs } from '../../../../actions/Observations/importWizard';

// ---- Redux mock ----
const mockDispatch = vi.fn(() => Promise.resolve());
let mockStoreState = {};

vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- useDebounce mock (returns value immediately) ----
vi.mock('../../../../hooks', () => ({
  useDebounce: value => value,
  useNotification: () => ({
    onSuccess: vi.fn(),
    onError: vi.fn(),
    onWarning: vi.fn(),
    onInfo: vi.fn()
  })
}));

// ---- Actions mock ----
vi.mock('../../../../actions/Observations/importWizard', () => ({
  searchDevices: vi.fn(() => () => Promise.resolve([])),
  createDevice: vi.fn(
    data => () =>
      Promise.resolve({
        id: 1,
        name: data.name,
        brandName: data.brandName || null,
        author: null
      })
  ),
  fetchSensorConfigs: vi.fn(() => () => Promise.resolve([])),
  createSensorConfig: vi.fn(() => () => Promise.resolve()),
  SET_CONFIRMED_DEVICE: 'SET_CONFIRMED_DEVICE',
  CLEAR_CONFIRMED_DEVICE: 'CLEAR_CONFIRMED_DEVICE'
}));

vi.mock('../../../../actions/Substance', () => ({
  searchSubstances: () => () => Promise.resolve([]),
  createSubstance: () => () => Promise.resolve({ id: 1, name: 'Nitrate' })
}));

vi.mock('../components/SubstanceAutocomplete', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ value, onChange }) =>
      React.createElement(
        'div',
        { 'data-testid': 'sensor-config-substance' },
        React.createElement(
          'button',
          {
            'data-testid': 'substance-select-button',
            onClick: () =>
              onChange({
                id: 1,
                name: 'Nitrate',
                formula: 'NO₃⁻',
                casNumber: null,
                externalId: '943',
                externalSource: 'PubChem'
              })
          },
          value ? value.name : 'Select substance'
        )
      )
  };
});

// ---- i18n messages used by DeviceSensorsStep ----
const messages = {
  'ImportObservationsWizard.DeviceSensorsStep.title': 'Device & Sensors',
  'ImportObservationsWizard.DeviceSensorsStep.description':
    'Define the device and sensor configurations used in this file.',
  'ImportObservationsWizard.DeviceSensorsStep.createNewDevice':
    'Create new device\u2026',
  'ImportObservationsWizard.DeviceSensorsStep.createDevice': 'Create device',
  'ImportObservationsWizard.DeviceSensorsStep.createDeviceError':
    'Failed to create device. Please try again.',
  'ImportObservationsWizard.DeviceSensorsStep.searchDevice': 'Device',
  'ImportObservationsWizard.DeviceSensorsStep.searchDevicePlaceholder':
    'Search for a device\u2026',
  'ImportObservationsWizard.DeviceSensorsStep.deviceName': 'Device name',
  'ImportObservationsWizard.DeviceSensorsStep.deviceBrand': 'Brand',
  'ImportObservationsWizard.DeviceSensorsStep.deviceProductUrl': 'Product URL',
  'ImportObservationsWizard.DeviceSensorsStep.deviceManufacturerUrl':
    'Manufacturer URL',
  'ImportObservationsWizard.DeviceSensorsStep.newDeviceTitle': 'New device',
  'ImportObservationsWizard.DeviceSensorsStep.changeDevice': 'Change',
  'ImportObservationsWizard.DeviceSensorsStep.sensorConfigPhaseTitle':
    'Sensor configurations',
  'ImportObservationsWizard.DeviceSensorsStep.deviceAuthor': 'by {nickname}',
  'ImportObservationsWizard.DeviceSensorsStep.myDevicesOnly': 'My devices only',
  'ImportObservationsWizard.DeviceSensorsStep.noSensorsYet':
    'No sensor configurations yet. Add one below.',
  'ImportObservationsWizard.DeviceSensorsStep.addSensorConfig':
    'Add sensor configuration',
  'ImportObservationsWizard.DeviceSensorsStep.addSensorTitle':
    'New sensor configuration',
  'ImportObservationsWizard.DeviceSensorsStep.advancedFields':
    'Advanced fields',
  'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMax':
    'Detection limit (max)',
  'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMin':
    'Detection limit (min)',
  'ImportObservationsWizard.DeviceSensorsStep.precisionLower':
    'Precision (lower)',
  'ImportObservationsWizard.DeviceSensorsStep.precisionUpper':
    'Precision (upper)',
  'ImportObservationsWizard.DeviceSensorsStep.quantityKind': 'Quantity kind',
  'ImportObservationsWizard.DeviceSensorsStep.resolution': 'Resolution',
  'ImportObservationsWizard.DeviceSensorsStep.sensorConfigLabel': 'Label',
  'ImportObservationsWizard.DeviceSensorsStep.substance': 'Substance',
  'ImportObservationsWizard.DeviceSensorsStep.substancePlaceholder':
    'Search substance...',
  'ImportObservationsWizard.DeviceSensorsStep.substanceNoResults': 'No results',
  'ImportObservationsWizard.DeviceSensorsStep.substanceViaPubChem':
    'via PubChem',
  'ImportObservationsWizard.DeviceSensorsStep.substanceSearchHint':
    'Type at least 2 characters',
  'ImportObservationsWizard.DeviceSensorsStep.unit': 'Unit',
  'ImportObservationsWizard.DeviceSensorsStep.deviceSerialNumber':
    'Serial number',
  'ImportObservationsWizard.cancel': 'Cancel',
  // Quantity kind labels
  'quantityKind.Temperature': 'Temperature',
  'quantityKind.RelativeHumidity': 'Relative Humidity',
  'quantityKind.AtmosphericPressure': 'Atmospheric Pressure',
  'quantityKind.WaterLevel': 'Water Level',
  'quantityKind.WaterFlow': 'Water Flow',
  'quantityKind.Conductivity': 'Conductivity',
  'quantityKind.pH': 'pH',
  'quantityKind.Precipitation': 'Precipitation',
  'quantityKind.DewPointTemperature': 'Dew Point Temperature',
  'quantityKind.Salinity': 'Salinity',
  'quantityKind.Turbidity': 'Turbidity',
  'quantityKind.RedoxPotential': 'Redox Potential',
  'quantityKind.Resistivity': 'Resistivity',
  'quantityKind.Concentration': 'Concentration',
  'quantityKind.LightIntensity': 'Light Intensity',
  'quantityKind.AirVelocity': 'Air Velocity',
  'quantityKind.WaterVelocity': 'Water Velocity',
  'quantityKind.IsotopeDelta': 'Isotope Delta'
};

const defaultState = {
  importWizard: {
    confirmedDevice: null,
    deviceSearchResults: [],
    sensorConfigs: [],
    sensorConfigsLoading: false,
    sensorConfigsError: null
  },
  login: {
    authTokenDecoded: { id: 42 }
  }
};

const renderComponent = async (storeOverrides = {}) => {
  mockStoreState = {
    ...defaultState,
    importWizard: {
      ...defaultState.importWizard,
      ...storeOverrides
    },
    login: defaultState.login
  };
  let result;
  await act(async () => {
    result = render(
      <IntlProvider locale="en" messages={messages}>
        <DeviceSensorsStep />
      </IntlProvider>
    );
  });
  // Flush microtasks from async effects (e.g. dispatch().finally())
  return result;
};

beforeEach(() => {
  mockDispatch.mockClear();
  mockDispatch.mockImplementation(() => Promise.resolve());
});

// The DeviceSelector component uses dispatch().finally(() => setIsSearching(false))
// inside useEffect. The .finally() resolves as a microtask after act() completes,
// triggering a harmless React "not wrapped in act" warning. The component uses a
// cleanup flag (cancelled) to guard against setState-on-unmount, making this safe.
// We suppress the specific warning to keep test output clean.
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act'))
      return;
    originalConsoleError(...args);
  };
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('DeviceSensorsStep', () => {
  describe('Phase 2 visibility', () => {
    it('hides Phase 2 when no device is confirmed', async () => {
      await renderComponent({ confirmedDevice: null });

      expect(
        screen.queryByTestId('sensor-config-phase')
      ).not.toBeInTheDocument();
    });

    it('shows Phase 2 when a device is confirmed', async () => {
      await renderComponent({
        confirmedDevice: {
          id: 1,
          name: 'Test Logger',
          brandName: 'BrandX',
          author: { id: '1', nickname: 'Admin' }
        }
      });

      expect(screen.getByTestId('sensor-config-phase')).toBeInTheDocument();
    });
  });

  describe('device selection', () => {
    it('shows selected device card when a device is confirmed', async () => {
      await renderComponent({
        confirmedDevice: {
          id: 1,
          name: 'Test Logger',
          brandName: 'BrandX',
          author: { id: '1', nickname: 'Admin' }
        }
      });

      expect(screen.getByTestId('selected-device-card')).toBeInTheDocument();
      expect(screen.getByText('Test Logger')).toBeInTheDocument();
      expect(screen.getByText('BrandX')).toBeInTheDocument();
    });

    it('shows device selector when no device is confirmed', async () => {
      await renderComponent({ confirmedDevice: null });

      expect(screen.getByTestId('device-selector')).toBeInTheDocument();
      expect(
        screen.queryByTestId('selected-device-card')
      ).not.toBeInTheDocument();
    });

    it('dispatches SET_CONFIRMED_DEVICE when selecting a device from autocomplete', async () => {
      const device = {
        id: 5,
        name: 'Logger Pro',
        brandName: 'Sci',
        author: { id: '42', nickname: 'Me' }
      };
      await renderComponent({
        confirmedDevice: null,
        deviceSearchResults: [device]
      });

      const input = screen
        .getByTestId('device-search-input')
        .querySelector('input');

      // Type to trigger search — flush the dispatch promise (.finally)
      await act(async () => {
        fireEvent.change(input, { target: { value: 'Log' } });
      });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const listbox = await screen.findByRole('listbox');
      const options = listbox.querySelectorAll('[role="option"]');

      // First option is the device, second is "Create new device…"
      fireEvent.click(options[0]);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_CONFIRMED_DEVICE',
        device
      });
    });

    it('shows author nickname in device dropdown options', async () => {
      const device = {
        id: 5,
        name: 'Logger Pro',
        brandName: 'Sci',
        author: { id: '99', nickname: 'JohnDoe' }
      };
      await renderComponent({
        confirmedDevice: null,
        deviceSearchResults: [device]
      });

      const input = screen
        .getByTestId('device-search-input')
        .querySelector('input');

      fireEvent.change(input, { target: { value: 'Log' } });
      // Flush microtasks (the .finally() on dispatch resolves setIsSearching)
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const listbox = await screen.findByRole('listbox');
      expect(listbox.textContent).toContain('JohnDoe');
    });
  });

  describe('device creation form', () => {
    it('shows create form and disables search when "Create new device" is clicked', async () => {
      await renderComponent({ confirmedDevice: null });

      const input = screen
        .getByTestId('device-search-input')
        .querySelector('input');

      // Type to show sentinel
      fireEvent.change(input, { target: { value: 'new' } });
      // Flush microtasks (the .finally() on dispatch resolves setIsSearching)
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const listbox = await screen.findByRole('listbox');
      const options = listbox.querySelectorAll('[role="option"]');

      // The only option when no results is "Create new device…"
      const createOption = Array.from(options).find(opt =>
        opt.textContent.includes('Create new device')
      );
      fireEvent.click(createOption);

      // Create form should be visible
      expect(screen.getByTestId('create-device-form')).toBeInTheDocument();

      // Search input should be disabled
      const searchInput = screen
        .getByTestId('device-search-input')
        .querySelector('input');
      expect(searchInput).toBeDisabled();
    });

    it('cancels creation and re-enables search', async () => {
      await renderComponent({ confirmedDevice: null });

      const input = screen
        .getByTestId('device-search-input')
        .querySelector('input');

      // Open create form
      fireEvent.change(input, { target: { value: 'new' } });
      // Flush microtasks (the .finally() on dispatch resolves setIsSearching)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const listbox = await screen.findByRole('listbox');
      const createOption = Array.from(
        listbox.querySelectorAll('[role="option"]')
      ).find(opt => opt.textContent.includes('Create new device'));
      fireEvent.click(createOption);

      expect(screen.getByTestId('create-device-form')).toBeInTheDocument();

      // Click cancel
      fireEvent.click(screen.getByTestId('create-device-cancel'));

      // Form hidden
      expect(
        screen.queryByTestId('create-device-form')
      ).not.toBeInTheDocument();

      // Search re-enabled
      const searchInput = screen
        .getByTestId('device-search-input')
        .querySelector('input');
      expect(searchInput).not.toBeDisabled();
    });
  });

  describe('Change button', () => {
    it('dispatches CLEAR_CONFIRMED_DEVICE when Change is clicked', async () => {
      await renderComponent({
        confirmedDevice: {
          id: 1,
          name: 'Test Logger',
          brandName: 'BrandX',
          author: null
        }
      });

      fireEvent.click(screen.getByTestId('change-device-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CLEAR_CONFIRMED_DEVICE'
      });
    });

    it('hides the selected device card after clearing', async () => {
      // Start with confirmed device
      let result;
      await act(async () => {
        result = render(
          <IntlProvider locale="en" messages={messages}>
            <DeviceSensorsStep />
          </IntlProvider>
        );
      });

      // Simulate clearing: re-render with no device
      mockStoreState = {
        ...defaultState,
        importWizard: { ...defaultState.importWizard, confirmedDevice: null }
      };

      await act(async () => {
        result.rerender(
          <IntlProvider locale="en" messages={messages}>
            <DeviceSensorsStep />
          </IntlProvider>
        );
      });

      expect(
        screen.queryByTestId('selected-device-card')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('device-selector')).toBeInTheDocument();
    });
  });

  describe('fetchSensorConfigs on device confirmation', () => {
    it('dispatches fetchSensorConfigs when confirmedDevice is set', async () => {
      const mockFetch = fetchSensorConfigs;

      await renderComponent({
        confirmedDevice: {
          id: 7,
          name: 'My Device',
          brandName: null,
          author: null
        }
      });

      expect(mockFetch).toHaveBeenCalledWith(7);
    });
  });
});
