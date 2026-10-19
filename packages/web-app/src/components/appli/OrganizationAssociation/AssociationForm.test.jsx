import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import AssociationForm from './AssociationForm';

const searchState = vi.hoisted(() => ({
  inputValue: '',
  results: [],
  isOnline: true
}));

vi.mock('@/hooks', () => ({
  useEntitySearch: () => ({
    inputValue: searchState.inputValue,
    setInputValue: vi.fn(),
    results: searchState.results,
    isLoading: false
  }),
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

describe('organization name length', () => {
  afterEach(() => {
    searchState.inputValue = '';
    searchState.results = [];
    searchState.isOnline = true;
  });

  it('rejects an oversized name even when the form is submitted directly', () => {
    searchState.inputValue = 'x'.repeat(201);
    const onSubmit = vi.fn();
    const { container } = renderForm(onSubmit);

    expect(screen.getByRole('button', { name: 'Associate' })).toBeEnabled();
    fireEvent.submit(container.querySelector('form'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText('Maximum 200 characters (201 entered).')
    ).toBeInTheDocument();
  });

  it('allows a name at the limit with an explicit type', async () => {
    searchState.inputValue = 'x'.repeat(200);
    const onSubmit = vi.fn();
    const { container } = renderForm(onSubmit);

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
    searchState.inputValue = 'New organization';
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    fireEvent.click(screen.getByRole('button', { name: 'Associate' }));
    await screen.findByText('Choose an organization type.');
    expect(
      screen.getByRole('combobox', { name: /Organization type/ })
    ).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('links an existing unclassified organization without asking for a type', async () => {
    searchState.inputValue = 'Existing';
    searchState.results = [{ id: 42, name: 'Existing', type: null }];
    const onSubmit = vi.fn();
    renderForm(onSubmit);
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
    searchState.inputValue = 'New organization';
    const onSubmit = vi.fn();
    const { container } = renderForm(onSubmit);
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: /Organization type/ })
    );
    fireEvent.click(screen.getByRole('option', { name: 'Publisher' }));
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });
});
