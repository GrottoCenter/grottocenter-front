import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  'guidelines.description': 'Instructions',
  'guidelines.creation_association':
    'This guideline will be associated with {entityName}.',
  'guidelines.instructions_required': 'Instructions are required.',
  'guidelines.instructions_too_long':
    'Instructions cannot exceed {count} characters.',
  'Title must be less than 150 characters.': 'Title is too long',
  'Applies to': 'Applies to',
  Countries: 'Countries',
  Regions: 'Regions',
  Massifs: 'Massifs',
  'guidelines.scope_required': 'Select at least one geographical entity.',
  Create: 'Create',
  Update: 'Update',
  Cancel: 'Cancel'
};

const renderForm = (onSubmit, associatedScope = undefined, formProps = {}) => {
  const { isNew = true, values = undefined } = formProps;
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
          isNew={isNew}
          withScope
          values={values}
          associatedScope={associatedScope}
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
  await user.type(
    screen.getByRole('textbox', { name: /Instructions/ }),
    'Follow the marked path.'
  );
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

it('shows the fixed association without scope selectors and submits its id', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  renderForm(onSubmit, {
    type: 'massifs',
    value: { id: 7, name: 'Vercors' }
  });

  expect(screen.getByRole('alert')).toHaveTextContent(
    'This guideline will be associated with Vercors.'
  );
  expect(screen.getByText('Vercors').tagName).toBe('STRONG');
  expect(
    screen.queryByRole('combobox', { name: 'Countries' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('combobox', { name: 'Regions' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('combobox', { name: 'Massifs' })
  ).not.toBeInTheDocument();

  await user.type(screen.getByRole('textbox', { name: /Title/ }), 'Access');
  await user.type(
    screen.getByRole('textbox', { name: /Instructions/ }),
    'Follow the marked path.'
  );
  const submitButton = screen.getByRole('button', { name: 'Create' });
  await waitFor(() => expect(submitButton).toBeEnabled());
  await user.click(submitButton);

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ countries: [], regions: [], massifs: [7] })
    )
  );
});

it('requires instructions and applies the message character-limit pattern', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  renderForm(onSubmit, {
    type: 'massifs',
    value: { id: 7, name: 'Vercors' }
  });

  const instructions = screen.getByRole('textbox', {
    name: /Instructions/
  });
  const submitButton = screen.getByRole('button', { name: 'Create' });

  expect(instructions).toHaveAttribute('maxlength', '600');
  expect(screen.getByText('0 / 500')).toBeVisible();

  await user.type(screen.getByRole('textbox', { name: /Title/ }), 'Access');
  await user.type(instructions, '   ');
  expect(submitButton).toBeDisabled();
  expect(screen.getByText('Instructions are required.')).toBeVisible();

  fireEvent.change(instructions, { target: { value: 'a'.repeat(500) } });
  await waitFor(() => expect(submitButton).toBeEnabled());
  expect(screen.getByText('500 / 500')).toBeVisible();

  fireEvent.change(instructions, { target: { value: 'a'.repeat(501) } });
  await waitFor(() => expect(submitButton).toBeDisabled());
  expect(
    screen.getByText('Instructions cannot exceed 500 characters.')
  ).toBeVisible();
  expect(screen.getByText('501 / 500')).toBeVisible();
});

it('requires instructions when editing an existing guideline', () => {
  renderForm(vi.fn(), undefined, {
    isNew: false,
    values: {
      id: 42,
      title: 'Access',
      description: '',
      language: 'eng',
      countries: ['FR'],
      regions: [],
      massifs: []
    }
  });

  expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  expect(screen.getByRole('textbox', { name: /Instructions/ })).toBeRequired();
});
