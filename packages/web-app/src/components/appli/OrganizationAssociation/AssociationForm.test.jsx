import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import AssociationForm from './AssociationForm';

const searchState = vi.hoisted(() => ({
  results: [],
  isOnline: true
}));

vi.mock('@/hooks', () => ({
  useDebounce: value => value,
  useQuickSearch: vi.fn(() => ({
    data: { results: searchState.results },
    isFetching: false
  })),
  useOnlineStatus: () => searchState.isOnline
}));

const renderForm = onSubmit =>
  render(
    <IntlProvider
      locale="en"
      messages={{
        ...messages,
        'Search or create organization': 'Search or create organization',
        Associate: 'Associate',
        'form.maxLength': 'Maximum {limit} characters ({count} entered).',
        'Select an existing organization from the list, or a new one named "{name}" will be created.':
          'A new organization named "{name}" will be created.'
      }}>
      <AssociationForm onClose={vi.fn()} onSubmit={onSubmit} />
    </IntlProvider>
  );

const enterName = value =>
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Search or create organization' }),
    { target: { value } }
  );

describe('organization name length', () => {
  afterEach(() => {
    searchState.results = [];
    searchState.isOnline = true;
  });

  it('rejects an oversized name even when the form is submitted directly', async () => {
    const onSubmit = vi.fn();
    const { container } = renderForm(onSubmit);
    enterName('x'.repeat(201));

    expect(screen.getByRole('button', { name: 'Associate' })).toBeEnabled();
    await act(async () => fireEvent.submit(container.querySelector('form')));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText('Maximum 200 characters (201 entered).')
    ).toBeInTheDocument();
  });

  it('allows a name at the limit with an explicit type', async () => {
    const onSubmit = vi.fn();
    const { container } = renderForm(onSubmit);
    enterName('x'.repeat(200));

    const input = screen.getByRole('combobox', {
      name: 'Search or create organization'
    });
    expect(input).toHaveAttribute('maxLength', '200');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByText('200 / 200')).toBeInTheDocument();
    expect(screen.queryByText(/Maximum/)).not.toBeInTheDocument();
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: /Organization type/ })
    );
    fireEvent.click(screen.getByRole('option', { name: 'Publisher' }));
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'x'.repeat(200),
        type: 'EDITION'
      })
    );
  });

  it('blocks creation without a type and focuses its selector', async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    enterName('New organization');
    fireEvent.click(screen.getByRole('button', { name: 'Associate' }));
    await screen.findByText('Choose an organization type.');
    expect(
      screen.getByRole('combobox', { name: /Organization type/ })
    ).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('links an existing unclassified organization without asking for a type', async () => {
    searchState.results = [{ id: 42, name: 'Existing', type: null }];
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    enterName('Existing');
    fireEvent.click(screen.getByRole('button', { name: 'Associate' }));
    await screen.findByText('Choose an organization type.');
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'Search or create organization' })
    );
    fireEvent.click(await screen.findByRole('option', { name: 'Existing' }));
    expect(
      screen.queryByRole('combobox', { name: /Organization type/ })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Associate' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ id: 42, name: 'Existing' })
    );
  });

  it('cannot submit an association offline', async () => {
    searchState.isOnline = false;
    const onSubmit = vi.fn();
    const { container } = renderForm(onSubmit);
    enterName('New organization');
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: /Organization type/ })
    );
    fireEvent.click(screen.getByRole('option', { name: 'Publisher' }));
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });

  it('validates whitespace-only input and submits the corrected trimmed name', async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    enterName('   ');
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: /Organization type/ })
    );
    fireEvent.click(screen.getByRole('option', { name: 'Publisher' }));
    fireEvent.click(screen.getByRole('button', { name: 'Associate' }));
    expect(await screen.findByText('Required')).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
    enterName(' New publisher ');
    fireEvent.click(screen.getByRole('button', { name: 'Associate' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'New publisher',
        type: 'EDITION'
      })
    );
  });
});
