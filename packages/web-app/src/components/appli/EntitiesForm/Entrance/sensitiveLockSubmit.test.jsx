import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, Controller } from 'react-hook-form';
import PropTypes from 'prop-types';
import { makeEntranceData } from './transformers';
import { ENTRANCE_ONLY } from './caveType';

// Mirrors EntranceForm's default value composition (index.jsx) and the
// admin-only lock Controller of EntranceDetail, so the submitted payload is
// produced by the same wiring as the real form. The point of these tests is
// the non-admin path: the lock Controller is never mounted for them, so the
// value can only come from the form defaults.
const defaultEntranceValues = {
  name: '',
  language: 'eng',
  isSensitive: false,
  isSensitiveLocked: false,
  latitude: '',
  longitude: ''
};

const LockFormHarness = ({ entranceValues, isAdmin, onPayload }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      entrance: { ...defaultEntranceValues, ...entranceValues },
      cave: { id: 1, language: 'eng', name: 'A cave' }
    }
  });

  return (
    <form
      onSubmit={handleSubmit(data =>
        onPayload(makeEntranceData(data, ENTRANCE_ONLY))
      )}>
      {isAdmin && (
        <Controller
          name="entrance.isSensitiveLocked"
          control={control}
          defaultValue={false}
          render={({ field: { value, onChange } }) => (
            <button type="button" onClick={() => onChange(!value)}>
              toggle lock
            </button>
          )}
        />
      )}
      <button type="submit">save</button>
    </form>
  );
};

LockFormHarness.propTypes = {
  entranceValues: PropTypes.shape({}).isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onPayload: PropTypes.func.isRequired
};

const submitAs = async (isAdmin, entranceValues, act) => {
  const onPayload = vi.fn();
  render(
    <LockFormHarness
      isAdmin={isAdmin}
      entranceValues={entranceValues}
      onPayload={onPayload}
    />
  );
  if (act) await act();
  await userEvent.click(screen.getByRole('button', { name: 'save' }));
  return onPayload.mock.calls[0][0];
};

describe('entrance lock state on submit', () => {
  it('keeps a locked entrance locked when a non-admin saves it', async () => {
    const payload = await submitAs(false, {
      name: 'An entrance',
      isSensitive: true,
      isSensitiveLocked: true
    });

    // The lock Controller is admin-only and therefore unmounted here: the
    // persisted value must survive from the form defaults rather than fall
    // back to the `false` of defaultEntranceValues.
    expect(payload.isSensitiveLocked).toBe(true);
  });

  it('does not lock an unlocked entrance when a non-admin saves it', async () => {
    const payload = await submitAs(false, {
      name: 'An entrance',
      isSensitiveLocked: false
    });

    expect(payload.isSensitiveLocked).toBe(false);
  });

  it('omits the key when the API returned no lock state', async () => {
    const payload = await submitAs(false, {
      name: 'An entrance',
      isSensitiveLocked: undefined
    });

    expect('isSensitiveLocked' in payload).toBe(false);
  });

  it('lets an administrator unlock an entrance', async () => {
    const payload = await submitAs(
      true,
      { name: 'An entrance', isSensitiveLocked: true },
      () => userEvent.click(screen.getByRole('button', { name: 'toggle lock' }))
    );

    expect(payload.isSensitiveLocked).toBe(false);
  });
});
