import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import AssociationForm from './AssociationForm';

const searchState = vi.hoisted(() => ({ inputValue: '' }));

vi.mock('@/hooks', () => ({
  useEntitySearch: () => ({
    inputValue: searchState.inputValue,
    setInputValue: vi.fn(),
    results: [],
    isLoading: false
  }),
  useOnlineStatus: () => true
}));

const renderForm = onSubmit =>
  render(
    <IntlProvider
      locale="en"
      messages={{
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
  });

  it('rejects an oversized name even when the form is submitted directly', () => {
    searchState.inputValue = 'x'.repeat(201);
    const onSubmit = vi.fn();
    const { container } = renderForm(onSubmit);

    expect(screen.getByRole('button', { name: 'Associate' })).toBeDisabled();
    fireEvent.submit(container.querySelector('form'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText('Maximum 200 characters (201 entered).')
    ).toBeInTheDocument();
  });

  it('allows a name at the limit', () => {
    searchState.inputValue = 'x'.repeat(200);
    const onSubmit = vi.fn();
    const { container } = renderForm(onSubmit);

    fireEvent.submit(container.querySelector('form'));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'x'.repeat(200) });
  });
});
