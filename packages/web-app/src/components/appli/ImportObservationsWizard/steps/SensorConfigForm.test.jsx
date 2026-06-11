import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import SensorConfigForm from './SensorConfigForm';

// ---- Redux mock ----
const mockDispatch = jest.fn(() => Promise.resolve());

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch
}));

// ---- Notification mock ----
const mockEnqueueSnackbar = jest.fn();
jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
    closeSnackbar: jest.fn()
  })
}));

// ---- Actions mock ----
const mockCreateSensorConfig = jest.fn();
jest.mock('../../../../actions/Observations/importWizard', () => ({
  createSensorConfig: (...args) => mockCreateSensorConfig(...args)
}));

const messages = {
  'ImportObservationsWizard.DeviceSensorsStep.addSensorTitle':
    'Add sensor configuration',
  'ImportObservationsWizard.DeviceSensorsStep.addSensorConfig':
    'Add configuration',
  'ImportObservationsWizard.DeviceSensorsStep.quantityKind': 'Quantity kind',
  'ImportObservationsWizard.DeviceSensorsStep.unit': 'Unit',
  'ImportObservationsWizard.DeviceSensorsStep.advancedFields':
    'Advanced fields',
  'ImportObservationsWizard.DeviceSensorsStep.precisionUpper':
    'Precision upper',
  'ImportObservationsWizard.DeviceSensorsStep.precisionLower':
    'Precision lower',
  'ImportObservationsWizard.DeviceSensorsStep.resolution': 'Resolution',
  'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMin':
    'Detection limit min',
  'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMax':
    'Detection limit max',
  'ImportObservationsWizard.DeviceSensorsStep.validationPrecisionError':
    'Precision lower must be \u2264 precision upper',
  'ImportObservationsWizard.DeviceSensorsStep.validationDetectionError':
    'Detection limit min must be \u2264 detection limit max',
  'ImportObservationsWizard.DeviceSensorsStep.createSensorConfigError':
    'Failed to create sensor configuration.',
  'ImportObservationsWizard.DeviceSensorsStep.sensorConfigCreated':
    'Sensor configuration saved successfully.',
  'quantityKind.AirVelocity': 'Air velocity',
  'quantityKind.AmmoniumConcentration': 'Ammonium concentration',
  'quantityKind.AtmosphericPressure': 'Atmospheric pressure',
  'quantityKind.CO2Concentration': 'CO₂ concentration',
  'quantityKind.Conductivity': 'Conductivity',
  'quantityKind.DewPointTemperature': 'Dew point temperature',
  'quantityKind.DissolvedOxygen': 'Dissolved oxygen',
  'quantityKind.LightIntensity': 'Light intensity',
  'quantityKind.NitrateConcentration': 'Nitrate concentration',
  'quantityKind.NitriteConcentration': 'Nitrite concentration',
  'quantityKind.pH': 'pH',
  'quantityKind.PhosphateConcentration': 'Phosphate concentration',
  'quantityKind.Precipitation': 'Precipitation',
  'quantityKind.RadonConcentration': 'Radon concentration',
  'quantityKind.RedoxPotential': 'Redox potential',
  'quantityKind.RelativeHumidity': 'Relative humidity',
  'quantityKind.Resistivity': 'Resistivity',
  'quantityKind.Salinity': 'Salinity',
  'quantityKind.SilicateConcentration': 'Silicate concentration',
  'quantityKind.Temperature': 'Temperature',
  'quantityKind.TotalDissolvedSolids': 'Total dissolved solids',
  'quantityKind.Turbidity': 'Turbidity',
  'quantityKind.WaterFlow': 'Water flow',
  'quantityKind.WaterLevel': 'Water level',
  'quantityKind.WaterVelocity': 'Water velocity'
};

const renderComponent = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SensorConfigForm deviceId={42} />
    </IntlProvider>
  );

beforeEach(() => {
  mockDispatch.mockClear();
  mockCreateSensorConfig.mockClear();
  mockEnqueueSnackbar.mockClear();
  mockDispatch.mockImplementation(() => Promise.resolve());
});

describe('SensorConfigForm', () => {
  describe('dropdown filtering', () => {
    it('disables unit dropdown when no quantity kind is selected', () => {
      renderComponent();

      const unitInput = screen
        .getByTestId('sensor-config-unit')
        .querySelector('input');
      expect(unitInput).toBeDisabled();
    });

    it('enables unit dropdown when a quantity kind is selected', () => {
      renderComponent();

      // Select Temperature (id: 1) from the quantity kind dropdown
      const qkSelect = screen
        .getByTestId('sensor-config-quantity-kind')
        .querySelector('[role="combobox"]');
      fireEvent.mouseDown(qkSelect);

      const tempOption = screen.getByText('Temperature');
      fireEvent.click(tempOption);

      const unitInput = screen
        .getByTestId('sensor-config-unit')
        .querySelector('input');
      expect(unitInput).not.toBeDisabled();
    });

    it('preselects first compatible unit when quantity kind changes', () => {
      renderComponent();

      // Select Temperature (id: 1)
      const qkSelect = screen
        .getByTestId('sensor-config-quantity-kind')
        .querySelector('[role="combobox"]');
      fireEvent.mouseDown(qkSelect);
      fireEvent.click(screen.getByText('Temperature'));

      // Unit should be preselected to id 1 (°C, first compatible unit for Temperature)
      const unitInput = screen
        .getByTestId('sensor-config-unit')
        .querySelector('input');
      expect(unitInput.value).toBe('1');

      // Change quantity kind to AtmosphericPressure
      fireEvent.mouseDown(qkSelect);
      fireEvent.click(screen.getByText('Atmospheric pressure'));

      // Unit should be preselected to id 3 (hPa, first compatible unit for AtmosphericPressure)
      expect(unitInput.value).toBe('3');
    });
  });

  describe('submit button state', () => {
    it('disables submit when quantity kind is empty', () => {
      renderComponent();

      const submitButton = screen.getByTestId('sensor-config-submit');
      expect(submitButton).toBeDisabled();
    });

    it('disables submit when no quantity kind is selected', () => {
      renderComponent();

      const submitButton = screen.getByTestId('sensor-config-submit');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit when quantity kind is selected (unit auto-preselected)', () => {
      renderComponent();

      // Select quantity kind — unit gets preselected automatically
      const qkSelect = screen
        .getByTestId('sensor-config-quantity-kind')
        .querySelector('[role="combobox"]');
      fireEvent.mouseDown(qkSelect);
      fireEvent.click(screen.getByText('Temperature'));

      const submitButton = screen.getByTestId('sensor-config-submit');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('validation', () => {
    it('shows error when precision_lower > precision_upper', async () => {
      renderComponent();

      // Select quantity kind — unit is auto-preselected
      const qkSelect = screen
        .getByTestId('sensor-config-quantity-kind')
        .querySelector('[role="combobox"]');
      fireEvent.mouseDown(qkSelect);
      fireEvent.click(screen.getByText('Temperature'));

      // Expand advanced fields
      fireEvent.click(screen.getByText('Advanced fields'));

      // Set invalid precision values
      const precUpperInput = screen
        .getByTestId('sensor-config-precision-upper')
        .querySelector('input');
      const precLowerInput = screen
        .getByTestId('sensor-config-precision-lower')
        .querySelector('input');

      fireEvent.change(precUpperInput, { target: { value: '1' } });
      fireEvent.change(precLowerInput, { target: { value: '5' } });

      // Submit
      fireEvent.click(screen.getByTestId('sensor-config-submit'));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Precision lower must be \u2264 precision upper'
          )
        ).toBeInTheDocument();
      });
    });

    it('shows error when detection_limit_min > detection_limit_max', async () => {
      renderComponent();

      // Select quantity kind — unit is auto-preselected
      const qkSelect = screen
        .getByTestId('sensor-config-quantity-kind')
        .querySelector('[role="combobox"]');
      fireEvent.mouseDown(qkSelect);
      fireEvent.click(screen.getByText('Temperature'));

      // Expand advanced fields
      fireEvent.click(screen.getByText('Advanced fields'));

      // Set invalid detection limit values
      const detMinInput = screen
        .getByTestId('sensor-config-detection-min')
        .querySelector('input');
      const detMaxInput = screen
        .getByTestId('sensor-config-detection-max')
        .querySelector('input');

      fireEvent.change(detMinInput, { target: { value: '100' } });
      fireEvent.change(detMaxInput, { target: { value: '10' } });

      // Submit
      fireEvent.click(screen.getByTestId('sensor-config-submit'));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Detection limit min must be \u2264 detection limit max'
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('successful creation', () => {
    it('dispatches createSensorConfig and resets form on success', async () => {
      const createdConfig = {
        id: 99,
        quantityKindCode: 'Temperature',
        unitSymbol: '°C'
      };
      mockCreateSensorConfig.mockReturnValue(createdConfig);
      mockDispatch.mockResolvedValue(createdConfig);

      renderComponent();

      // Select quantity kind — unit is auto-preselected to °C
      const qkSelect = screen
        .getByTestId('sensor-config-quantity-kind')
        .querySelector('[role="combobox"]');
      fireEvent.mouseDown(qkSelect);
      fireEvent.click(screen.getByText('Temperature'));

      // Submit
      fireEvent.click(screen.getByTestId('sensor-config-submit'));

      await waitFor(() => {
        expect(mockCreateSensorConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceId: 42,
            quantityKindId: 1,
            unitId: 1
          })
        );
      });

      // Form should be reset
      await waitFor(() => {
        const qkInput = screen
          .getByTestId('sensor-config-quantity-kind')
          .querySelector('input');
        expect(qkInput.value).toBe('');
      });
    });

    it('shows error alert when API call fails', async () => {
      mockCreateSensorConfig.mockImplementation(() => {
        throw new Error('API error');
      });
      mockDispatch.mockRejectedValue(new Error('API error'));

      renderComponent();

      // Select quantity kind — unit is auto-preselected
      const qkSelect = screen
        .getByTestId('sensor-config-quantity-kind')
        .querySelector('[role="combobox"]');
      fireEvent.mouseDown(qkSelect);
      fireEvent.click(screen.getByText('Temperature'));

      // Submit
      fireEvent.click(screen.getByTestId('sensor-config-submit'));

      await waitFor(() => {
        expect(
          screen.getByTestId('sensor-config-form-error')
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'Failed to create sensor configuration.'
          )
        ).toBeInTheDocument();
      });
    });
  });
});
