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
  'ImportObservationsWizard.DeviceSensorsStep.sensorConfigLabel':
    'Label',
  'ImportObservationsWizard.DeviceSensorsStep.quantityKind': 'Quantity kind',
  'ImportObservationsWizard.DeviceSensorsStep.unit': 'Unit',
  'ImportObservationsWizard.DeviceSensorsStep.substance': 'Substance',
  'ImportObservationsWizard.DeviceSensorsStep.substancePlaceholder':
    'e.g. NO₃⁻, δ¹⁸O',
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
  'quantityKind.AtmosphericPressure': 'Atmospheric pressure',
  'quantityKind.CO2Concentration': 'CO₂ concentration',
  'quantityKind.Concentration': 'Concentration',
  'quantityKind.Conductivity': 'Conductivity',
  'quantityKind.DewPointTemperature': 'Dew point temperature',
  'quantityKind.DissolvedOxygen': 'Dissolved oxygen',
  'quantityKind.IsotopeDelta': 'Isotope delta',
  'quantityKind.LightIntensity': 'Light intensity',
  'quantityKind.pH': 'pH',
  'quantityKind.Precipitation': 'Precipitation',
  'quantityKind.RadonConcentration': 'Radon concentration',
  'quantityKind.RedoxPotential': 'Redox potential',
  'quantityKind.RelativeHumidity': 'Relative humidity',
  'quantityKind.Resistivity': 'Resistivity',
  'quantityKind.Salinity': 'Salinity',
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

  describe('substance field behavior', () => {
    const selectQuantityKind = label => {
      const qkSelect = screen
        .getByTestId('sensor-config-quantity-kind')
        .querySelector('[role="combobox"]');
      fireEvent.mouseDown(qkSelect);
      fireEvent.click(screen.getByText(label));
    };

    it('shows substance field when Concentration (id 17) is selected', () => {
      renderComponent();
      selectQuantityKind('Concentration');

      expect(
        screen.getByTestId('sensor-config-substance')
      ).toBeInTheDocument();
    });

    it('hides substance field when Temperature (id 1) is selected', () => {
      renderComponent();
      selectQuantityKind('Temperature');

      expect(
        screen.queryByTestId('sensor-config-substance')
      ).not.toBeInTheDocument();
    });

    it('clears substance when changing from Concentration to Temperature', () => {
      renderComponent();

      // Select Concentration
      selectQuantityKind('Concentration');

      // Type a substance
      const substanceInput = screen
        .getByTestId('sensor-config-substance')
        .querySelector('input');
      fireEvent.change(substanceInput, { target: { value: 'NO₃⁻' } });
      expect(substanceInput.value).toBe('NO₃⁻');

      // Switch to Temperature
      selectQuantityKind('Temperature');

      // Substance field should be gone
      expect(
        screen.queryByTestId('sensor-config-substance')
      ).not.toBeInTheDocument();

      // Switch back to Concentration — substance should be empty
      selectQuantityKind('Concentration');
      const newSubstanceInput = screen
        .getByTestId('sensor-config-substance')
        .querySelector('input');
      expect(newSubstanceInput.value).toBe('');
    });

    it('preserves substance when switching between Concentration and IsotopeDelta', () => {
      renderComponent();

      // Select Concentration
      selectQuantityKind('Concentration');

      // Type a substance
      const substanceInput = screen
        .getByTestId('sensor-config-substance')
        .querySelector('input');
      fireEvent.change(substanceInput, { target: { value: 'δ¹⁸O' } });
      expect(substanceInput.value).toBe('δ¹⁸O');

      // Switch to IsotopeDelta — substance should be preserved
      selectQuantityKind('Isotope delta');
      const preservedInput = screen
        .getByTestId('sensor-config-substance')
        .querySelector('input');
      expect(preservedInput.value).toBe('δ¹⁸O');
    });

    it('has maxLength of 100 on substance input', () => {
      renderComponent();
      selectQuantityKind('Concentration');

      const substanceInput = screen
        .getByTestId('sensor-config-substance')
        .querySelector('input');
      expect(substanceInput).toHaveAttribute('maxLength', '100');
    });

    it('disables submit when substance is empty with substance-requiring QK', () => {
      renderComponent();
      selectQuantityKind('Concentration');

      const submitButton = screen.getByTestId('sensor-config-submit');
      expect(submitButton).toBeDisabled();
    });

    it('disables submit when substance is whitespace-only with substance-requiring QK', () => {
      renderComponent();
      selectQuantityKind('Concentration');

      const substanceInput = screen
        .getByTestId('sensor-config-substance')
        .querySelector('input');
      fireEvent.change(substanceInput, { target: { value: '   ' } });

      const submitButton = screen.getByTestId('sensor-config-submit');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit when substance has non-whitespace content', () => {
      renderComponent();
      selectQuantityKind('Concentration');

      const substanceInput = screen
        .getByTestId('sensor-config-substance')
        .querySelector('input');
      fireEvent.change(substanceInput, { target: { value: 'NO₃⁻' } });

      const submitButton = screen.getByTestId('sensor-config-submit');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('error handling', () => {
    const selectQuantityKind = label => {
      const qkSelect = screen
        .getByTestId('sensor-config-quantity-kind')
        .querySelector('[role="combobox"]');
      fireEvent.mouseDown(qkSelect);
      fireEvent.click(screen.getByText(label));
    };

    it('clears error when any field changes', async () => {
      // Make the first submit fail with generic error
      mockDispatch.mockRejectedValueOnce(new Error('Server error'));

      renderComponent();
      selectQuantityKind('Temperature');

      // Submit to trigger error
      fireEvent.click(screen.getByTestId('sensor-config-submit'));

      await waitFor(() => {
        expect(
          screen.getByTestId('sensor-config-form-error')
        ).toBeInTheDocument();
      });

      // Change a field — error should clear
      selectQuantityKind('Atmospheric pressure');

      expect(
        screen.queryByTestId('sensor-config-form-error')
      ).not.toBeInTheDocument();
    });

    it('displays API 400 error message verbatim', async () => {
      const apiError = new Error('Validation failed');
      apiError.status = 400;
      apiError.body = { message: 'Substance is required for Concentration' };
      mockDispatch.mockRejectedValueOnce(apiError);

      renderComponent();
      selectQuantityKind('Concentration');

      // Fill in substance so submit is enabled
      const substanceInput = screen
        .getByTestId('sensor-config-substance')
        .querySelector('input');
      fireEvent.change(substanceInput, { target: { value: 'NO₃⁻' } });

      // Submit
      fireEvent.click(screen.getByTestId('sensor-config-submit'));

      await waitFor(() => {
        expect(
          screen.getByTestId('sensor-config-form-error')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Substance is required for Concentration')
        ).toBeInTheDocument();
      });
    });

    it('displays generic localized message for 5xx errors', async () => {
      const serverError = new Error('Internal server error');
      serverError.status = 500;
      serverError.body = { message: 'internal crash details' };
      mockDispatch.mockRejectedValueOnce(serverError);

      renderComponent();
      selectQuantityKind('Temperature');

      // Submit
      fireEvent.click(screen.getByTestId('sensor-config-submit'));

      await waitFor(() => {
        expect(
          screen.getByTestId('sensor-config-form-error')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Failed to create sensor configuration.')
        ).toBeInTheDocument();
      });
    });

    it('clears error after successful submit following a failed one', async () => {
      // First submit fails
      const apiError = new Error('Validation failed');
      apiError.status = 400;
      apiError.body = { message: 'Substance too long' };
      mockDispatch.mockRejectedValueOnce(apiError);

      renderComponent();
      selectQuantityKind('Temperature');

      // Submit — should fail
      fireEvent.click(screen.getByTestId('sensor-config-submit'));

      await waitFor(() => {
        expect(
          screen.getByTestId('sensor-config-form-error')
        ).toBeInTheDocument();
      });

      // Change field to clear error, then submit again successfully
      selectQuantityKind('Atmospheric pressure');

      expect(
        screen.queryByTestId('sensor-config-form-error')
      ).not.toBeInTheDocument();

      // Successful submit
      mockDispatch.mockResolvedValueOnce({ id: 1 });
      mockCreateSensorConfig.mockReturnValueOnce({ id: 1 });
      fireEvent.click(screen.getByTestId('sensor-config-submit'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('sensor-config-form-error')
        ).not.toBeInTheDocument();
      });
    });
  });
});
