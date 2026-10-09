import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import EntranceDetail from './EntranceDetail';

vi.mock('../../../../hooks', () => ({
  usePermissions: () => ({ isAdmin: true }),
  useNearbyEntrances: () => []
}));

vi.mock('../utils/CoordinateFormSection', () => ({
  default: () => null
}));

const messages = {
  Altitude: 'Altitude',
  'Existing nearby entrances': 'Existing nearby entrances',
  'form.numericRange': 'Enter a value between {min} and {max}.',
  'Sensitivity Management': 'Sensitivity Management',
  'Sensitive entrance': 'Sensitive entrance',
  'Lock sensitivity': 'Lock sensitivity',
  'Unlock sensitivity': 'Unlock sensitivity',
  'Marking an entrance as sensitive hides its location from everyone except administrators. For more details, see the User Guide.':
    'Sensitivity explanation',
  'The sensitivity of this entrance is locked. Unlock it to change its sensitivity.':
    'The sensitivity of this entrance is locked. Unlock it to change its sensitivity.'
};

const EntranceDetailHarness = ({ onSubmit = vi.fn() }) => {
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm({
    defaultValues: {
      entrance: {
        isSensitive: true,
        isSensitiveLocked: true,
        latitude: 0,
        longitude: 0
      }
    }
  });

  return (
    <IntlProvider locale="en" messages={messages}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EntranceDetail
          control={control}
          errors={errors}
          getValues={getValues}
        />
        <button type="submit">Save</button>
      </form>
    </IntlProvider>
  );
};

describe('EntranceDetail sensitivity lock', () => {
  it('requires an administrator to unlock sensitivity before changing it', async () => {
    render(<EntranceDetailHarness />);

    const sensitivitySwitch = screen.getByRole('switch', {
      name: 'Sensitive entrance'
    });

    expect(sensitivitySwitch).toBeDisabled();
    expect(
      screen.getByText(
        'The sensitivity of this entrance is locked. Unlock it to change its sensitivity.'
      )
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Unlock sensitivity' })
    );

    expect(sensitivitySwitch).toBeEnabled();
  });

  it('enforces altitude bounds and allows negative boundary values', async () => {
    const onSubmit = vi.fn();
    render(<EntranceDetailHarness onSubmit={onSubmit} />);
    const altitude = screen.getByLabelText('Altitude');
    expect(altitude).toHaveAttribute('min', '-9999');
    expect(altitude).toHaveAttribute('max', '9999');
    fireEvent.change(altitude, { target: { value: '-10000' } });
    fireEvent.click(screen.getByText('Save'));
    expect(
      await screen.findByText('Enter a value between -9999 and 9999.')
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(altitude, { target: { value: '-9999' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].entrance.altitude).toBe('-9999');
  });
});
