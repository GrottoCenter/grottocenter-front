import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import frenchMessages from '@/../public/lang/fr.json';

import { DeleteConfirmationDialog, DELETED_ENTITIES } from './Deleted';

const searchState = vi.hoisted(() => ({ results: [], error: null }));
const viewportState = vi.hoisted(() => ({ isNarrow: false }));

vi.mock('@mui/material/useMediaQuery', () => ({
  default: () => viewportState.isNarrow
}));
const redirectState = vi.hoisted(() => ({
  data: null,
  isPending: false,
  isFetching: false,
  isPaused: false,
  error: null
}));

vi.mock('@/hooks/useDeletedEntityRedirectTarget', () => ({
  useDeletedEntityRedirectTarget: () => redirectState
}));

vi.mock('@/hooks', () => ({
  useDebounce: value => value,
  useQuickSearch: () => ({
    data: { results: searchState.results },
    error: searchState.error,
    isFetching: false
  })
}));

vi.mock('../StandardDialog', () => ({
  default: ({ open, title, children, actions, fullScreen, scrollable }) =>
    open ? (
      <div
        data-testid="deletion-dialog"
        data-fullscreen={fullScreen}
        data-scrollable={scrollable}>
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
    viewportState.isNarrow = false;
    Object.assign(redirectState, {
      data: null,
      isPending: false,
      isFetching: false,
      isPaused: false,
      error: null
    });
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

  it('uses a fullscreen scrollable dialog only on narrow viewports', () => {
    viewportState.isNarrow = true;
    const { rerender } = render(renderDialog());
    expect(screen.getByTestId('deletion-dialog')).toHaveAttribute(
      'data-fullscreen',
      'true'
    );
    expect(screen.getByTestId('deletion-dialog')).toHaveAttribute(
      'data-scrollable',
      'true'
    );
    viewportState.isNarrow = false;
    rerender(renderDialog());
    expect(screen.getByTestId('deletion-dialog')).toHaveAttribute(
      'data-fullscreen',
      'false'
    );
  });

  const prefilledDialog = (props = {}) => (
    <IntlProvider locale="fr" messages={frenchMessages}>
      <DeleteConfirmationDialog
        entityType={DELETED_ENTITIES.massif}
        entityId={42}
        existingRedirectId={43}
        isOpen
        isLoading={false}
        isPermanent
        onClose={() => {}}
        onConfirmation={() => {}}
        {...props}
      />
    </IntlProvider>
  );

  it('prefills the existing target and submits its id', () => {
    redirectState.data = { id: 43, name: 'Destination' };
    const onConfirmation = vi.fn();
    render(prefilledDialog({ onConfirmation }));
    expect(screen.getByText('Destination')).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Fusionner et supprimer définitivement'
      })
    );
    expect(onConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 43, title: 'Destination' })
    );
  });

  it('blocks deletion during loading, lets users clear the target and resets on reopening', () => {
    redirectState.isPending = true;
    const { rerender } = render(prefilledDialog());
    expect(
      screen.getByRole('button', {
        name: 'Supprimer définitivement'
      })
    ).toBeDisabled();
    redirectState.isPending = false;
    redirectState.data = { id: 43, name: 'Destination' };
    rerender(prefilledDialog());
    fireEvent.click(screen.getByRole('button', { name: 'supprimer' }));
    rerender(prefilledDialog());
    expect(screen.queryByText('Destination')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Supprimer définitivement'
      })
    ).toBeEnabled();
    rerender(prefilledDialog({ isOpen: false }));
    rerender(prefilledDialog());
    expect(screen.getByText('Destination')).toBeVisible();
  });

  it.each([
    { id: 42, name: 'Self' },
    { id: 43, name: 'Deleted', isDeleted: true },
    { id: 43, name: 'Redirected', redirectTo: 44 },
    null
  ])('rejects an invalid existing target: %j', data => {
    redirectState.data = data;
    render(prefilledDialog());
    expect(screen.getByRole('alert')).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'Supprimer définitivement'
      })
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Changer de destination ou continuer sans fusion'
      })
    );
    expect(
      screen.getByRole('button', {
        name: 'Supprimer définitivement'
      })
    ).toBeEnabled();
  });

  it('does not restore a late target after the user starts choosing another one', async () => {
    redirectState.isPending = true;
    const onConfirmation = vi.fn();
    const { rerender } = render(prefilledDialog({ onConfirmation }));
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'massif' }
    });
    expect(
      screen.getByRole('button', {
        name: 'Supprimer définitivement'
      })
    ).toBeDisabled();
    fireEvent.click(
      await screen.findByRole('option', { name: /Other massif/ })
    );
    redirectState.isPending = false;
    redirectState.data = { id: 43, name: 'Late destination' };
    rerender(prefilledDialog({ onConfirmation }));
    expect(screen.queryByText('Late destination')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Fusionner et supprimer définitivement'
      })
    );
    expect(onConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Other massif' })
    );
  });

  it('allows explicitly abandoning hydration without accepting its late result', () => {
    redirectState.isPending = true;
    const onConfirmation = vi.fn();
    const { rerender } = render(prefilledDialog({ onConfirmation }));
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'destination' }
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Changer de destination ou continuer sans fusion'
      })
    );
    redirectState.isPending = false;
    redirectState.data = { id: 43, name: 'Late destination' };
    rerender(prefilledDialog({ onConfirmation }));
    expect(screen.queryByText('Late destination')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Supprimer définitivement'
      })
    );
    expect(onConfirmation).toHaveBeenCalledWith(null);
  });

  it('keeps mandatory merging disabled after clearing the prefilled target', () => {
    redirectState.data = { id: 43, name: 'Destination' };
    render(prefilledDialog({ isSearchMandatory: true }));
    fireEvent.click(screen.getByRole('button', { name: 'supprimer' }));
    expect(
      screen.getByRole('button', {
        name: 'Fusionner et supprimer définitivement'
      })
    ).toBeDisabled();
  });

  it('does not prefill a soft deletion or an entity without a redirect', () => {
    redirectState.data = { id: 43, name: 'Destination' };
    const { rerender } = render(prefilledDialog({ isPermanent: false }));
    expect(screen.queryByText('Destination')).not.toBeInTheDocument();
    rerender(prefilledDialog({ existingRedirectId: null }));
    expect(screen.queryByText('Destination')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Supprimer définitivement'
      })
    ).toBeEnabled();
  });

  it('discards the old selection when switching source entities', () => {
    redirectState.data = { id: 43, name: 'Destination' };
    const { rerender } = render(prefilledDialog());
    rerender(prefilledDialog({ entityId: 50, existingRedirectId: null }));
    expect(screen.queryByText('Destination')).not.toBeInTheDocument();
  });

  it('keeps an unavailable target blocked while typing until a replacement is selected', async () => {
    redirectState.error = new Error('Not found');
    render(prefilledDialog());
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'massif' }
    });
    expect(
      screen.getByRole('button', {
        name: 'Supprimer définitivement'
      })
    ).toBeDisabled();
    fireEvent.click(
      await screen.findByRole('option', { name: /Other massif/ })
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Fusionner et supprimer définitivement'
      })
    ).toBeEnabled();
  });

  it('uses the document detail title and type for the prefilled card', () => {
    redirectState.data = { id: 43, title: 'Bibliographie', type: 'Book' };
    render(prefilledDialog({ entityType: DELETED_ENTITIES.document }));
    expect(screen.getByText('[Book] Bibliographie')).toBeVisible();
  });

  it('surfaces an offline target resolution instead of allowing deletion', () => {
    redirectState.isPaused = true;
    redirectState.isPending = true;
    render(prefilledDialog());
    expect(screen.getByRole('alert')).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'Supprimer définitivement'
      })
    ).toBeDisabled();
  });
});
