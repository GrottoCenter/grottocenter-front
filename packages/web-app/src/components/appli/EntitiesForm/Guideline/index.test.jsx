import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import GuidelineForm from './index';

vi.mock('../../../../hooks', () => ({
  useEntitySearch: () => ({
    inputValue: '',
    setInputValue: vi.fn(),
    results: [],
    isLoading: false
  }),
  useRegionsSearch: () => ({ data: [], isFetching: false }),
  useOnlineStatus: () => true
}));

vi.mock('../../../common/LanguageSelect', () => ({
  default: ({ value, onChange }) => (
    <select
      aria-label="Language"
      value={value}
      onChange={event => onChange(event.target.value)}>
      <option value="eng">English</option>
    </select>
  )
}));

const messages = {
  'guidelines.title': 'Title',
  'guidelines.description': 'Description',
  'Title must be less than 150 characters.': 'Title is too long',
  'Description must be less than 500 characters.': 'Description is too long',
  'Applies to': 'Applies to',
  Countries: 'Countries',
  Regions: 'Regions',
  Massifs: 'Massifs',
  'guidelines.scope_required': 'Select at least one geographical entity.',
  Create: 'Create',
  Cancel: 'Cancel'
};

const renderForm = onSubmit => {
  const store = configureStore({
    reducer: () => ({
      intl: {
        locale: 'en',
        AVAILABLE_LANGUAGES: { en: { id: 'eng' } }
      }
    })
  });
  return render(
    <Provider store={store}>
      <IntlProvider locale="en" messages={messages}>
        <GuidelineForm
          isNew
          withScope
          closeForm={vi.fn()}
          onSubmit={onSubmit}
        />
      </IntlProvider>
    </Provider>
  );
};

it('enables creation only after required fields and scope are valid', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  renderForm(onSubmit);

  const submitButton = screen.getByRole('button', { name: 'Create' });
  expect(
    screen.getByText('Select at least one geographical entity.')
  ).toBeVisible();
  expect(submitButton).toBeDisabled();

  await user.type(screen.getByRole('textbox', { name: /Title/ }), 'Access');
  expect(submitButton).toBeDisabled();
  expect(onSubmit).not.toHaveBeenCalled();

  const countries = screen.getByRole('combobox', { name: 'Countries' });
  await user.click(countries);
  await user.type(countries, 'France');
  await user.click(await screen.findByRole('option', { name: 'France' }));
  expect(screen.getByText('France').closest('.MuiChip-root')).toHaveClass(
    'MuiChip-colorPrimary'
  );
  await waitFor(() => expect(submitButton).toBeEnabled());
  await user.click(submitButton);

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ countries: ['FR'], regions: [], massifs: [] })
    )
  );
});
