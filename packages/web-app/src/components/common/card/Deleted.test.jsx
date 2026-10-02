import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { DeleteConfirmationDialog, DELETED_ENTITIES } from './Deleted';

const searchState = vi.hoisted(() => ({ results: [], error: null }));

vi.mock('@/hooks', () => ({
  useDebounce: value => value,
  useQuickSearch: () => ({
    data: { results: searchState.results },
    error: searchState.error,
    isFetching: false
  })
}));

vi.mock('../StandardDialog', () => ({
  default: ({ open, children, actions }) =>
    open ? (
      <div>
        {children}
        {actions}
      </div>
    ) : null
}));

const messages = {
  Massif: 'Massif',
  'Deletion confirmation': 'Deletion confirmation',
  'Merge and permanently delete': 'Merge and permanently delete',
  Cancel: 'Cancel',
  Delete: 'Delete',
  disabled: 'disabled',
  'Search for a {entityFmt}': 'Search for a {entityFmt}',
  'delete-permanent-confirmation-dialog': 'Delete {entityFmt}?',
  'delete-permanent-merge-mandatory': 'Merge into another {entityFmt}',
  remove: 'remove',
  'An entity cannot redirect to itself.':
    'An entity cannot redirect to itself.',
  'Unable to search for a replacement. Please try again.':
    'Unable to search for a replacement. Please try again.',
  'No result (enter at least {count} characters)':
    'No result (enter at least {count} characters)'
};

const renderDialog = (entityId = 42, onConfirmation = vi.fn()) => (
  <IntlProvider locale="en" messages={messages}>
    <DeleteConfirmationDialog
      entityType={DELETED_ENTITIES.massif}
      entityId={entityId}
      isOpen
      isLoading={false}
      isPermanent
      isSearchMandatory
      onClose={() => {}}
      onConfirmation={onConfirmation}
    />
  </IntlProvider>
);

describe('DeleteConfirmationDialog replacement selection', () => {
  beforeEach(() => {
    searchState.error = null;
    searchState.results = [
      { id: '42', name: 'Current massif', _type: 'massifs' },
      { id: 43, name: 'Other massif', _type: 'massifs' }
    ];
  });

  it.each([42, '42'])(
    'excludes the current entity (%s) and lets users select another result',
    async entityId => {
      const onConfirmation = vi.fn();
      render(renderDialog(entityId, onConfirmation));
      const confirmButton = screen.getByRole('button', {
        name: 'Merge and permanently delete'
      });
      expect(confirmButton).toBeDisabled();

      fireEvent.focus(screen.getByRole('combobox'));
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'massif' }
      });
      const otherResult = await screen.findByRole('option', {
        name: /Other massif/
      });
      expect(
        screen.queryByRole('option', { name: /Current massif/ })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      fireEvent.click(otherResult);
      expect(confirmButton).toBeEnabled();
      fireEvent.click(confirmButton);

      expect(onConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({ id: 43, title: 'Other massif' })
      );
    }
  );

  it('shows a separate search error and clears it after recovery', () => {
    const { rerender } = render(renderDialog());
    const constraintHint = screen.getByText(
      'An entity cannot redirect to itself.'
    );
    expect(constraintHint).not.toHaveAttribute('aria-live');
    expect(constraintHint).not.toHaveClass('Mui-error');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'massif' }
    });
    searchState.error = new Error('search failed');
    searchState.results = [];
    rerender(renderDialog());

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to search for a replacement. Please try again.'
    );
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(constraintHint).not.toHaveClass('Mui-error');

    searchState.error = null;
    rerender(renderDialog());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'false'
    );
  });
});
