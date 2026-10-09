import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useForm } from 'react-hook-form';

import CaveDetail from './CaveDetail';

const messages = {
  Characteristics: 'Characteristics',
  Depth: 'Depth',
  Development: 'Development',
  Temperature: 'Temperature',
  'Year of discovery': 'Year of discovery',
  'Diving cave': 'Diving cave',
  'Touristic site': 'Touristic site',
  'form.numericRange': 'Enter a value between {min} and {max}.',
  'Temperature must be an integer (in °C)':
    'Temperature must be an integer (in °C)',
  'Temperature must be between -100 and 100 °C':
    'Temperature must be between -100 and 100 °C'
};

const CaveDetailHarness = ({
  showEntranceFields = true,
  onSubmit = vi.fn()
}) => {
  const { control, handleSubmit } = useForm({
    defaultValues: { cave: {}, entrance: {} }
  });

  return (
    <IntlProvider locale="en" messages={messages}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <CaveDetail
          control={control}
          errors={{}}
          showEntranceFields={showEntranceFields}
        />
        <button type="submit">Save</button>
      </form>
    </IntlProvider>
  );
};

describe('CaveDetail', () => {
  it('shows entrance-specific fields in an entrance form', () => {
    render(<CaveDetailHarness />);

    expect(screen.getByLabelText('Year of discovery')).toBeInTheDocument();
    expect(screen.getByLabelText('Year of discovery')).toHaveAttribute(
      'min',
      '-9999'
    );
    expect(screen.getByLabelText('Year of discovery')).toHaveAttribute(
      'max',
      String(new Date().getFullYear())
    );
    expect(screen.getByText('Touristic site')).toBeInTheDocument();
  });

  it('only shows cave fields in a network form', () => {
    render(<CaveDetailHarness showEntranceFields={false} />);

    expect(screen.getByLabelText('Depth')).toBeInTheDocument();
    expect(screen.getByText('Diving cave')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Year of discovery')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Touristic site')).not.toBeInTheDocument();
  });

  it.each([true, false])(
    'validates cave characteristics with entrance fields %s',
    async showEntranceFields => {
      const onSubmit = vi.fn();
      render(
        <CaveDetailHarness
          showEntranceFields={showEntranceFields}
          onSubmit={onSubmit}
        />
      );
      const depth = screen.getByLabelText('Depth');
      const development = screen.getByLabelText('Development');
      expect(depth).toHaveAttribute('max', '20000');
      expect(development).toHaveAttribute('max', '100000000');
      fireEvent.change(depth, { target: { value: '20001' } });
      fireEvent.change(development, { target: { value: '100000001' } });
      fireEvent.click(screen.getByText('Save'));
      await waitFor(() =>
        expect(depth).toHaveAttribute('aria-invalid', 'true')
      );
      expect(onSubmit).not.toHaveBeenCalled();
      fireEvent.change(depth, { target: { value: '20000' } });
      fireEvent.change(development, { target: { value: '100000000' } });
      fireEvent.change(screen.getByLabelText('Temperature'), {
        target: { value: '101' }
      });
      fireEvent.click(screen.getByText('Save'));
      expect(
        await screen.findByText('Temperature must be between -100 and 100 °C')
      ).toBeVisible();
      expect(onSubmit).not.toHaveBeenCalled();
      fireEvent.change(screen.getByLabelText('Temperature'), {
        target: { value: '0' }
      });
      fireEvent.click(screen.getByText('Save'));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    }
  );
});
