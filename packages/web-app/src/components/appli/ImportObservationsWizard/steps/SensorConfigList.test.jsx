import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import SensorConfigList from './SensorConfigList';
import { fetchSensorConfigs } from '../../../../actions/Observations/importWizard';

// ---- Redux mock ----
const mockDispatch = vi.fn(() => Promise.resolve());
let mockStoreState = {};

vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- Actions mock ----
vi.mock('../../../../actions/Observations/importWizard', () => ({
  fetchSensorConfigs: vi.fn(id => ({
    type: 'FETCH_SENSOR_CONFIGS',
    deviceId: id
  }))
}));

const messages = {
  'ImportObservationsWizard.DeviceSensorsStep.noSensorsYet':
    'No sensor configurations yet. Add one below.',
  'ImportObservationsWizard.DeviceSensorsStep.sensorConfigLoadError':
    'Failed to load sensor configurations.',
  'ImportObservationsWizard.DeviceSensorsStep.sensorConfigRetry': 'Retry',
  'ImportObservationsWizard.DeviceSensorsStep.sensorPrecision':
    'Precision: {lower} \u2013 {upper}',
  'ImportObservationsWizard.DeviceSensorsStep.resolution': 'Resolution',
  'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMin':
    'Detection limit min',
  'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMax':
    'Detection limit max',
  'quantityKind.Temperature': 'Temperature',
  'quantityKind.RelativeHumidity': 'Relative humidity'
};

const renderComponent = (storeOverrides = {}) => {
  mockStoreState = {
    importWizard: {
      sensorConfigs: [],
      sensorConfigsLoading: false,
      sensorConfigsError: null,
      ...storeOverrides
    }
  };
  return render(
    <IntlProvider locale="en" messages={messages}>
      <SensorConfigList deviceId={42} />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockDispatch.mockClear();
});

describe('SensorConfigList', () => {
  it('shows loading skeletons while fetching', () => {
    renderComponent({ sensorConfigsLoading: true });

    expect(
      screen.getByTestId('sensor-config-list-loading')
    ).toBeInTheDocument();
  });

  it('shows error alert with retry button on failure', () => {
    renderComponent({ sensorConfigsError: 'Network error' });

    expect(screen.getByTestId('sensor-config-list-error')).toBeInTheDocument();
    expect(
      screen.getByText('Failed to load sensor configurations.')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('sensor-config-retry-button')
    ).toBeInTheDocument();
  });

  it('dispatches fetchSensorConfigs on retry click', () => {
    renderComponent({ sensorConfigsError: 'Network error' });

    fireEvent.click(screen.getByTestId('sensor-config-retry-button'));

    expect(mockDispatch).toHaveBeenCalled();
    expect(fetchSensorConfigs).toHaveBeenCalledWith(42);
  });

  it('shows empty state when no configs exist', () => {
    renderComponent({ sensorConfigs: [] });

    expect(screen.getByTestId('sensor-config-list-empty')).toBeInTheDocument();
    expect(
      screen.getByText('No sensor configurations yet. Add one below.')
    ).toBeInTheDocument();
  });

  it('renders config items with quantity kind and unit', () => {
    renderComponent({
      sensorConfigs: [
        {
          id: 1,
          quantityKindCode: 'Temperature',
          unitSymbol: '°C',
          precisionLower: null,
          precisionUpper: null,
          resolution: null,
          detectionLimitMin: null,
          detectionLimitMax: null
        },
        {
          id: 2,
          quantityKindCode: 'RelativeHumidity',
          unitSymbol: '%',
          precisionLower: 0.1,
          precisionUpper: 0.5,
          resolution: 0.01,
          detectionLimitMin: null,
          detectionLimitMax: null
        }
      ]
    });

    expect(screen.getByTestId('sensor-config-list')).toBeInTheDocument();
    const items = screen.getAllByTestId('sensor-config-item');
    expect(items).toHaveLength(2);
    expect(screen.getByText('Temperature (°C)')).toBeInTheDocument();
    expect(screen.getByText('Relative humidity (%)')).toBeInTheDocument();
  });
});
