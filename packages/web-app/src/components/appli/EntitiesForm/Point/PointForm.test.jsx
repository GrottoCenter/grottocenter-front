import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import PointForm from './index';

vi.mock('@/hooks', () => ({
  useCave: () => ({ data: undefined }),
  useOnlineStatus: () => true
}));

vi.mock(
  '@/components/common/AutoCompleteSearch/CaveAutoCompleteSearch',
  () => ({
    default: ({ onSelection, inputRef, onBlur, error, helperText, value }) => (
      <>
        <input
          aria-label="Entrance or network"
          aria-invalid={error}
          ref={inputRef}
          onBlur={onBlur}
        />
        {error && <span>{helperText}</span>}
        <button
          type="button"
          onClick={() => onSelection({ id: 11, name: 'Test cave' })}>
          Select cave
        </button>
        {value && (
          <button type="button" onClick={() => onSelection(null)}>
            Clear
          </button>
        )}
      </>
    )
  })
);

vi.mock('../utils/CoordinateFormSection', () => ({
  default: () => null
}));

const renderForm = values => {
  const onSubmit = vi.fn();
  render(
    <IntlProvider locale="en" messages={messages}>
      <PointForm
        values={values}
        isNew={!values}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    </IntlProvider>
  );
  return onSubmit;
};

const selectUnderground = () => {
  fireEvent.click(screen.getByRole('checkbox', { name: 'Underground' }));
};

const submit = () => fireEvent.click(screen.getByTestId('point-submit'));
const caveInput = () => screen.getByLabelText('Entrance or network');

describe('underground point cave validation', () => {
  it('blocks creation after classification and accepts a selected cave', async () => {
    const onSubmit = renderForm();
    fireEvent.change(screen.getByTestId('point-label').querySelector('input'), {
      target: { value: 'New station' }
    });
    selectUnderground();
    submit();
    await waitFor(() => expect(caveInput()).toHaveFocus());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(caveInput()).toHaveAttribute('aria-invalid', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Select cave' }));
    submit();
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        label: 'New station',
        underground: true,
        caveId: 11
      })
    );
  });

  it.each([true, false])(
    'blocks an unassociated edit after underground was %s',
    async underground => {
      const onSubmit = renderForm({
        id: 5,
        label: 'Legacy station',
        underground,
        caveId: null,
        latitude: 45,
        longitude: 6
      });
      if (!underground) selectUnderground();
      submit();
      await waitFor(() => expect(caveInput()).toHaveFocus());
      expect(onSubmit).not.toHaveBeenCalled();
      expect(caveInput()).toHaveAttribute('aria-invalid', 'true');
    }
  );

  it('blocks editing after the associated cave is cleared', async () => {
    const onSubmit = renderForm({
      id: 5,
      label: 'Existing station',
      underground: true,
      caveId: 11
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Clear' }));
    submit();
    await waitFor(() => expect(caveInput()).toHaveFocus());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
