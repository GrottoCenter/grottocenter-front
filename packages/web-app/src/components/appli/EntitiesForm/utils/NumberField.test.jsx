import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import {
  NUMERIC_FIELD_LIMITS,
  getDiscoveryYearLimits
} from '@/utils/numericFieldLimits';
import messages from '@/../public/lang/en.json';
import NumberField from './NumberField';

const Harness = ({ value, min, max, disabled = false, rules, onSubmit }) => {
  const { control, handleSubmit } = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { amount: value }
  });
  return (
    <IntlProvider locale="en" messages={messages}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <NumberField
          name="amount"
          label="Altitude"
          icon="altitude"
          control={control}
          min={min}
          max={max}
          disabled={disabled}
          rules={rules}
        />
        <button type="submit">Save</button>
      </form>
    </IntlProvider>
  );
};

describe('NumberField range validation', () => {
  it('rejects browser badInput even when the exposed value is empty', async () => {
    const onSubmit = vi.fn();
    render(
      <Harness value="" {...NUMERIC_FIELD_LIMITS.DEPTH} onSubmit={onSubmit} />
    );
    const input = screen.getByRole('spinbutton');
    // JSDOM sanitizes letters instead of keeping the browser's editing buffer.
    const badInput = vi.spyOn(input.validity, 'badInput', 'get');
    badInput.mockReturnValue(true);
    fireEvent.blur(input);
    await screen.findByText('Enter a whole number.');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(input).toHaveFocus());
    expect(onSubmit).not.toHaveBeenCalled();
    badInput.mockReturnValue(false);
    fireEvent.change(input, { target: { value: '10' } });
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'false'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    badInput.mockRestore();
  });

  it('waits for blur, then clears the error during correction', async () => {
    render(
      <Harness value="" {...NUMERIC_FIELD_LIMITS.DEPTH} onSubmit={vi.fn()} />
    );
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '20001' } });
    expect(input).toHaveAttribute('aria-invalid', 'false');
    fireEvent.blur(input);
    await screen.findByText('Enter a value between 0 and 20000.');
    fireEvent.change(input, { target: { value: '20000' } });
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'false'));
  });

  it.each([
    NUMERIC_FIELD_LIMITS.ALTITUDE,
    NUMERIC_FIELD_LIMITS.DEPTH,
    NUMERIC_FIELD_LIMITS.DEVELOPMENT,
    getDiscoveryYearLimits()
  ])('blocks invalid values and accepts both boundaries: %j', async limits => {
    const onSubmit = vi.fn();
    render(<Harness {...limits} value={limits.max + 1} onSubmit={onSubmit} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', String(limits.min));
    expect(input).toHaveAttribute('max', String(limits.max));
    expect(input).toHaveAttribute('step', '1');
    expect(input).not.toHaveAttribute('maxlength');
    expect(input).toHaveAttribute('aria-invalid', 'false');

    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText(/Enter a value between/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: String(limits.min - 1) } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '1.5' } });
    fireEvent.click(screen.getByText('Save'));
    await screen.findByText('Enter a whole number.');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a whole number.')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: String(limits.min) } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith(
        { amount: String(limits.min) },
        expect.anything()
      )
    );
    fireEvent.change(input, { target: { value: String(limits.max) } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith(
        { amount: String(limits.max) },
        expect.anything()
      )
    );
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('allows optional empty values', async () => {
    const onSubmit = vi.fn();
    render(
      <Harness value="" {...NUMERIC_FIELD_LIMITS.DEPTH} onSubmit={onSubmit} />
    );
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('keeps locked fields disabled', () => {
    render(
      <Harness
        value={200}
        {...NUMERIC_FIELD_LIMITS.DEPTH}
        disabled
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByRole('spinbutton')).toBeDisabled();
  });

  it('does not block unrelated edits for a locked out-of-range value', async () => {
    const onSubmit = vi.fn();
    render(
      <Harness
        value={20001}
        {...NUMERIC_FIELD_LIMITS.DEPTH}
        disabled
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByRole('spinbutton')).toHaveAttribute(
      'aria-invalid',
      'false'
    );
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it.each([
    { validate: () => 'Custom validation failed' },
    { validate: { customRule: () => 'Custom validation failed' } }
  ])('preserves custom validation rules: %j', async rules => {
    const onSubmit = vi.fn();
    render(
      <Harness
        value={10}
        {...NUMERIC_FIELD_LIMITS.DEPTH}
        rules={rules}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Custom validation failed')).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
