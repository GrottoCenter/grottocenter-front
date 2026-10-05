import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { DeleteConfirmationDialog, DELETED_ENTITIES } from './Deleted';

const searchState = vi.hoisted(() => ({ results: [] }));

vi.mock('@/hooks', () => ({
  useDebounce: value => value,
  useQuickSearch: () => ({
    data: { results: searchState.results },
    error: null,
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

vi.mock('../AutoCompleteSearch', () => ({
  default: ({ suggestions, onSelection }) => (
    <div>
      {suggestions.map(suggestion => (
        <button
          key={suggestion.id}
          type="button"
          onClick={() => onSelection(suggestion)}>
          {suggestion.name}
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          onSelection({ id: 42, name: 'Current massif', _type: 'massifs' })
        }>
        Select stale current result
      </button>
    </div>
  )
}));

const messages = {
  Massif: 'Massif',
  'Deletion confirmation': 'Deletion confirmation',
  'Merge and permanently delete': 'Merge and permanently delete',
  Cancel: 'Cancel',
  'Search for a {entityFmt}': 'Search for a {entityFmt}',
  'delete-permanent-confirmation-dialog': 'Delete {entityFmt}?',
  'delete-permanent-merge-mandatory': 'Merge into another {entityFmt}',
  remove: 'remove'
};

describe('DeleteConfirmationDialog replacement selection', () => {
  it('excludes the current entity and rejects a stale self-selection', () => {
    searchState.results = [
      { id: '42', name: 'Current massif', _type: 'massifs' },
      { id: 43, name: 'Other massif', _type: 'massifs' }
    ];
    const onConfirmation = vi.fn();

    render(
      <IntlProvider locale="en" messages={messages}>
        <DeleteConfirmationDialog
          entityType={DELETED_ENTITIES.massif}
          entityId={42}
          isOpen
          isLoading={false}
          isPermanent
          isSearchMandatory
          onClose={() => {}}
          onConfirmation={onConfirmation}
        />
      </IntlProvider>
    );

    expect(
      screen.queryByRole('button', { name: 'Current massif' })
    ).not.toBeInTheDocument();
    const confirmButton = screen.getByRole('button', {
      name: 'Merge and permanently delete'
    });
    expect(confirmButton).toBeDisabled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Select stale current result' })
    );
    expect(confirmButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Other massif' }));
    expect(confirmButton).toBeEnabled();
    fireEvent.click(confirmButton);

    expect(onConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 43, title: 'Other massif' })
    );
  });
});
