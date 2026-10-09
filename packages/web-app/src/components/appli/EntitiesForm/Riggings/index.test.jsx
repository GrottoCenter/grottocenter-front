import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import CreateRiggingsForm from './index';

vi.mock('@/hooks', () => ({ useOnlineStatus: () => true }));
vi.mock('../../../common/LanguageSelect', () => ({
  default: () => <span>Language</span>
}));

const messages = {
  Title: 'Title',
  riggings: 'Riggings',
  obstacles: 'Obstacles',
  ropes: 'Ropes',
  anchors: 'Anchors',
  observations: 'Observations',
  Obstacle: 'Obstacle',
  Rope: 'Rope',
  Anchors: 'Anchors',
  Observations: 'Observations',
  'Add an obstacle': 'Add an obstacle',
  'Anchor notation legend': 'Anchor notation legend',
  'Obstacle notation legend': 'Obstacle notation legend',
  'Click to insert': 'Click to insert',
  'Insert a symbol': 'Insert a symbol',
  'Move this line up': 'Move this line up',
  'Move this line down': 'Move this line down',
  'Delete this line': 'Delete this line',
  Create: 'Create',
  'form.maxLength': 'Maximum {limit} characters ({count} entered).'
};

const renderForm = (values, onSubmit) => {
  const store = configureStore({
    reducer: () => ({
      intl: { locale: 'en', AVAILABLE_LANGUAGES: { en: { id: 'eng' } } }
    })
  });
  return render(
    <Provider store={store}>
      <IntlProvider locale="en" messages={messages}>
        <CreateRiggingsForm values={values} onSubmit={onSubmit} isNew />
      </IntlProvider>
    </Provider>
  );
};

it('blocks saving until the combined column length including separators fits', async () => {
  const onSubmit = vi.fn();
  renderForm(
    {
      title: 'Rigging',
      language: 'eng',
      obstacles: [
        { obstacle: 'a'.repeat(999), rope: '', anchor: '', observation: '' },
        { obstacle: 'b'.repeat(999), rope: '', anchor: '', observation: '' }
      ]
    },
    onSubmit
  );

  const submit = screen.getByRole('button', { name: 'Create' });
  expect(screen.getByText('2001 / 2000')).toBeInTheDocument();
  expect(submit).toBeDisabled();

  fireEvent.change(screen.getAllByRole('textbox', { name: 'Obstacle' })[1], {
    target: { value: 'b'.repeat(998) }
  });

  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
});
