import { render, screen } from '@testing-library/react';
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

vi.mock('../utils/NumberField', () => ({
  default: () => null
}));

const messages = {
  'Sensitivity Management': 'Sensitivity Management',
  'Sensitive entrance': 'Sensitive entrance',
  'Lock sensitivity': 'Lock sensitivity',
  'Unlock sensitivity': 'Unlock sensitivity',
  'Marking an entrance as sensitive hides its location from everyone except administrators. For more details, see the User Guide.':
    'Sensitivity explanation',
  'The sensitivity of this entrance is locked. Unlock it to change its sensitivity.':
    'The sensitivity of this entrance is locked. Unlock it to change its sensitivity.'
};

const EntranceDetailHarness = () => {
  const {
    control,
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
      <EntranceDetail control={control} errors={errors} getValues={getValues} />
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
});
