import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import frenchMessages from '@/../public/lang/fr.json';

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
  default: ({ open, title, children, actions }) =>
    open ? (
      <div>
        <h2>{title}</h2>
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
  'delete-confirmation-permanent-effect': 'This action is irreversible.',
  'delete-confirmation-merge-required-label': 'Merge — required',
  remove: 'remove',
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

  it('omits the self-redirection hint and shows search errors only on failure', () => {
    const { rerender } = render(renderDialog());
    expect(
      screen.queryByText('An entity cannot redirect to itself.')
    ).not.toBeInTheDocument();
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

    searchState.error = null;
    rerender(renderDialog());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'false'
    );
  });

  it.each([
    [
      'document',
      'ce document',
      'un document',
      'Ce document sera marqué comme supprimé. Il pourra être restauré.'
    ],
    [
      'entrance',
      'cette entrée',
      'une entrée',
      'Cette entrée sera marquée comme supprimée. Elle pourra être restaurée.'
    ]
  ])(
    'renders a compact French soft-delete confirmation for a %s',
    (type, description, searchLabel, effect) => {
      const onConfirmation = vi.fn();
      const onClose = vi.fn();
      const { container } = render(
        <IntlProvider locale="fr" messages={frenchMessages}>
          <DeleteConfirmationDialog
            entityType={DELETED_ENTITIES[type]}
            entityId={42}
            entityName="Exemple"
            isOpen
            isLoading={false}
            isPermanent={false}
            onClose={onClose}
            onConfirmation={onConfirmation}
          />
        </IntlProvider>
      );
      expect(
        screen.getByRole('heading', { name: `Supprimer ${description} ?` })
      ).toBeVisible();
      expect(screen.getByText('Exemple')).toBeVisible();
      const entityIcon = container.querySelector('img[alt=""]');
      expect(entityIcon).toHaveAttribute('width', '28');
      expect(entityIcon.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.getByText(effect)).toBeVisible();
      expect(screen.getByText('Redirection — facultatif')).toBeVisible();
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'placeholder',
        `Rechercher ${searchLabel}`
      );
      expect(container.querySelector('br')).toBeNull();
      expect(screen.getByTestId('DeleteRoundedIcon')).toBeVisible();
      expect(screen.queryByTestId('DeleteForeverRoundedIcon')).toBeNull();
      expect(screen.queryByText('Cette action est irréversible.')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
      expect(onConfirmation).toHaveBeenCalledWith(null);
      expect(onClose).toHaveBeenCalledOnce();
    }
  );

  it('keeps permanent deletion distinct from soft deletion', () => {
    render(renderDialog());
    expect(screen.getByText('This action is irreversible.')).toBeVisible();
    expect(screen.getByTestId('DeleteForeverRoundedIcon')).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'Merge and permanently delete'
      })
    ).toBeDisabled();
  });
});
