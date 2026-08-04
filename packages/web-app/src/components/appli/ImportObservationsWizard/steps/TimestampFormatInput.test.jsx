import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import TimestampFormatInput from './TimestampFormatInput';

// ─── i18n messages used by TimestampFormatInput ──────────────────────────────────

const messages = {
  'ImportObservationsWizard.FormatPillBuilder.allSamplesParse':
    'All {count} samples parse correctly',
  'ImportObservationsWizard.FormatPillBuilder.samplesFail':
    '{count} of {total} samples fail to parse',
  'ImportObservationsWizard.FormatInput.tokensTitle': 'Available format tokens',
  'ImportObservationsWizard.FormatInput.tokenColumn': 'Token',
  'ImportObservationsWizard.FormatInput.meaningColumn': 'Meaning',
  'ImportObservationsWizard.FormatInput.exampleColumn': 'Example',
  'ImportObservationsWizard.FormatInput.separatorsHint':
    'Separators: {separators}',
  'ImportObservationsWizard.FormatInput.helpAriaLabel':
    'Show format token reference',
  'ImportObservationsWizard.FormatInput.token.YYYY': 'Year (4-digit)',
  'ImportObservationsWizard.FormatInput.token.YY': 'Year (2-digit)',
  'ImportObservationsWizard.FormatInput.token.MM': 'Month (01-12)',
  'ImportObservationsWizard.FormatInput.token.M': 'Month (1-12)',
  'ImportObservationsWizard.FormatInput.token.DD': 'Day (01-31)',
  'ImportObservationsWizard.FormatInput.token.D': 'Day (1-31)',
  'ImportObservationsWizard.FormatInput.token.HH': 'Hour 24h (00-23)',
  'ImportObservationsWizard.FormatInput.token.H': 'Hour 24h (0-23)',
  'ImportObservationsWizard.FormatInput.token.hh': 'Hour 12h (01-12)',
  'ImportObservationsWizard.FormatInput.token.h': 'Hour 12h (1-12)',
  'ImportObservationsWizard.FormatInput.token.mm': 'Minute (00-59)',
  'ImportObservationsWizard.FormatInput.token.m': 'Minute (0-59)',
  'ImportObservationsWizard.FormatInput.token.ss': 'Second (00-59)',
  'ImportObservationsWizard.FormatInput.token.s': 'Second (0-59)',
  'ImportObservationsWizard.FormatInput.token.SSS': 'Milliseconds (000-999)',
  'ImportObservationsWizard.FormatInput.token.A': 'AM/PM'
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const renderComponent = (props = {}) => {
  const defaultProps = {
    timestampType: 'datetime',
    sampleValues: [],
    currentFormat: '',
    onChange: vi.fn()
  };
  const merged = { ...defaultProps, ...props };
  return render(
    <IntlProvider locale="en" messages={messages}>
      <TimestampFormatInput {...merged} />
    </IntlProvider>
  );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TimestampFormatInput', () => {
  describe('text input rendering', () => {
    it('renders a text input with the currentFormat value', () => {
      renderComponent({ currentFormat: 'YYYY-MM-DD' });

      const input = screen.getByTestId('format-input').querySelector('input');
      expect(input).toHaveValue('YYYY-MM-DD');
    });

    it('shows placeholder for datetime type', () => {
      renderComponent({ timestampType: 'datetime' });

      const input = screen.getByTestId('format-input').querySelector('input');
      expect(input).toHaveAttribute('placeholder', 'YYYY-MM-DD HH:mm:ss');
    });

    it('shows placeholder for dateOnly type', () => {
      renderComponent({ timestampType: 'dateOnly' });

      const input = screen.getByTestId('format-input').querySelector('input');
      expect(input).toHaveAttribute('placeholder', 'YYYY-MM-DD');
    });

    it('shows placeholder for timeOnly type', () => {
      renderComponent({ timestampType: 'timeOnly' });

      const input = screen.getByTestId('format-input').querySelector('input');
      expect(input).toHaveAttribute('placeholder', 'HH:mm:ss');
    });
  });

  describe('onChange callback', () => {
    it('calls onChange when user types in the input', () => {
      const onChange = vi.fn();
      renderComponent({ onChange });

      const input = screen.getByTestId('format-input').querySelector('input');
      fireEvent.change(input, { target: { value: 'YYYY' } });

      expect(onChange).toHaveBeenCalledWith('YYYY');
    });
  });

  describe('validation indicator', () => {
    it('shows green check icon when all samples parse correctly', () => {
      renderComponent({
        currentFormat: 'YYYY-MM-DD',
        sampleValues: ['2023-01-15', '2024-06-30']
      });

      expect(
        screen.getByTestId('validation-indicator-valid')
      ).toBeInTheDocument();
    });

    it('shows red cross icon when some samples fail to parse', () => {
      renderComponent({
        currentFormat: 'YYYY-MM-DD',
        sampleValues: ['2023-01-15', 'not-a-date', '2024-06-30']
      });

      expect(
        screen.getByTestId('validation-indicator-invalid')
      ).toBeInTheDocument();
    });

    it('hides validation indicator when format is empty', () => {
      renderComponent({
        currentFormat: '',
        sampleValues: ['2023-01-15']
      });

      expect(
        screen.queryByTestId('validation-indicator-valid')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('validation-indicator-invalid')
      ).not.toBeInTheDocument();
    });

    it('shows validation message on hover of valid icon', async () => {
      renderComponent({
        currentFormat: 'YYYY-MM-DD',
        sampleValues: ['2023-01-15', '2024-06-30']
      });

      const icon = screen.getByTestId('validation-indicator-valid');
      fireEvent.mouseOver(icon);

      expect(
        await screen.findByText('All 2 samples parse correctly')
      ).toBeInTheDocument();
    });

    it('shows validation message on hover of invalid icon', async () => {
      renderComponent({
        currentFormat: 'YYYY-MM-DD',
        sampleValues: ['2023-01-15', 'not-a-date', '2024-06-30']
      });

      const icon = screen.getByTestId('validation-indicator-invalid');
      fireEvent.mouseOver(icon);

      expect(
        await screen.findByText('1 of 3 samples fail to parse')
      ).toBeInTheDocument();
    });
  });

  describe('parsed preview', () => {
    it('displays parsed preview when format is valid', () => {
      renderComponent({
        currentFormat: 'YYYY-MM-DD',
        sampleValues: ['2023-01-15']
      });

      const preview = screen.getByTestId('parsed-preview');
      expect(preview).toBeInTheDocument();
      expect(preview.textContent).toContain('2023-01-15');
      expect(preview.textContent).toContain('→');
    });

    it('does not display parsed preview when format is invalid', () => {
      renderComponent({
        currentFormat: 'YYYY-MM-DD',
        sampleValues: ['not-a-date']
      });

      expect(screen.queryByTestId('parsed-preview')).not.toBeInTheDocument();
    });
  });

  describe('help tooltip', () => {
    it('shows the token reference on hover of the help icon', async () => {
      renderComponent({ timestampType: 'datetime' });

      const helpButton = screen.getByTestId('format-help-button');
      fireEvent.mouseOver(helpButton);

      // MUI Tooltip renders asynchronously
      const popover = await screen.findByTestId('token-reference-popover');
      expect(popover).toBeInTheDocument();
      expect(screen.getByText('Available format tokens')).toBeInTheDocument();
      expect(screen.getByText('YYYY')).toBeInTheDocument();
      expect(screen.getByText('Year (4-digit)')).toBeInTheDocument();
    });

    it('shows only date tokens for dateOnly type', async () => {
      renderComponent({ timestampType: 'dateOnly' });

      const helpButton = screen.getByTestId('format-help-button');
      fireEvent.mouseOver(helpButton);

      await screen.findByTestId('token-reference-popover');
      expect(screen.getByText('YYYY')).toBeInTheDocument();
      expect(screen.getByText('MM')).toBeInTheDocument();
      expect(screen.queryByText('HH')).not.toBeInTheDocument();
      expect(screen.queryByText('ss')).not.toBeInTheDocument();
    });

    it('shows only time tokens for timeOnly type', async () => {
      renderComponent({ timestampType: 'timeOnly' });

      const helpButton = screen.getByTestId('format-help-button');
      fireEvent.mouseOver(helpButton);

      await screen.findByTestId('token-reference-popover');
      expect(screen.getByText('HH')).toBeInTheDocument();
      expect(screen.getByText('mm')).toBeInTheDocument();
      expect(screen.queryByText('YYYY')).not.toBeInTheDocument();
      expect(screen.queryByText('DD')).not.toBeInTheDocument();
    });
  });
});
