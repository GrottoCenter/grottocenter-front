import { fireEvent, render, screen, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';

import Person from './Person';

const state = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  navigate: vi.fn(),
  permissions: { isAuth: true, isAdmin: true, isModerator: true }
}));

vi.mock('@tanstack/react-query', async importOriginal => ({
  ...(await importOriginal()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => state.navigate
}));

vi.mock('@/hooks', () => ({
  useDeletePerson: () => ({ mutateAsync: state.mutateAsync }),
  useUserProperties: () => ({ id: 9 }),
  usePermissions: () => state.permissions,
  useSharePage: () => vi.fn()
}));

vi.mock('@/components/common/Layouts/PageHeader', () => ({
  default: ({ actions }) => <div>{actions}</div>
}));

vi.mock('@/components/common/Layouts/ResponsiveActions', () => ({
  default: ({ items }) => (
    <div>
      {items
        .filter(item => !item.hidden)
        .map(item => (
          <button key={item.key} type="button" onClick={item.onClick}>
            {item.label}
          </button>
        ))}
    </div>
  )
}));

vi.mock('@/components/common/card/Deleted', () => ({
  DELETED_ENTITIES: { person: { url: '/ui/persons/', str: 'Person' } },
  DeleteConfirmationDialog: ({ isOpen, onConfirmation }) =>
    isOpen ? (
      <button type="button" onClick={() => onConfirmation({ id: 43 })}>
        Confirm deletion
      </button>
    ) : null
}));

vi.mock('./AuthorBody', () => ({ default: () => null }));
vi.mock('./CaverBody', () => ({ default: () => null }));

describe('Person permanent deletion', () => {
  beforeEach(() => {
    state.mutateAsync.mockReset();
    state.navigate.mockReset();
    state.permissions = { isAuth: true, isAdmin: true, isModerator: true };
  });

  it('opens the replacement only after the deletion succeeds', async () => {
    let resolveDeletion;
    const deletion = new Promise(resolve => {
      resolveDeletion = resolve;
    });
    state.mutateAsync.mockReturnValue(deletion);
    render(
      <IntlProvider locale="en" messages={messages}>
        <Person
          isLoading={false}
          person={{ id: 42, name: 'Current', type: 'AUTHOR' }}
        />
      </IntlProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));

    expect(state.mutateAsync).toHaveBeenCalledWith({
      id: 42,
      entityId: 43,
      isPermanent: true
    });
    expect(state.navigate).not.toHaveBeenCalled();

    await act(async () => resolveDeletion());
    expect(state.navigate).toHaveBeenCalledWith('/ui/persons/43', {
      replace: true
    });
  });
  it.each([
    ['CAVER', true, false, true],
    ['CAVER', false, true, false],
    ['AUTHOR', true, false, false],
    ['AUTHOR', false, true, true]
  ])(
    'matches API permissions for %s (admin=%s, moderator=%s)',
    (type, isAdmin, isModerator, canDelete) => {
      state.permissions = { isAuth: true, isAdmin, isModerator };
      render(
        <IntlProvider locale="en" messages={messages}>
          <Person
            isLoading={false}
            person={{ id: 42, name: 'Current', type }}
          />
        </IntlProvider>
      );
      expect(!!screen.queryByRole('button', { name: 'Delete' })).toBe(
        canDelete
      );
    }
  );

  it('never offers deletion of the reserved deleted-person record', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <Person isLoading={false} person={{ id: 8, type: 'CAVER' }} />
      </IntlProvider>
    );
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });
});
