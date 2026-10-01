import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import Person from './Person';

const state = vi.hoisted(() => ({ mutate: vi.fn(), navigate: vi.fn() }));

vi.mock('@tanstack/react-query', async importOriginal => ({
  ...(await importOriginal()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => state.navigate
}));

vi.mock('@/hooks', () => ({
  useDeletePerson: () => ({ mutate: state.mutate }),
  useUserProperties: () => ({ id: 9 }),
  usePermissions: () => ({ isAdmin: true, isModerator: true }),
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
    state.mutate.mockReset();
    state.navigate.mockReset();
  });

  it('opens the replacement only after the deletion succeeds', () => {
    render(
      <IntlProvider
        locale="en"
        messages={{ Delete: 'Delete', 'Copy link': 'Copy link' }}>
        <Person
          isLoading={false}
          person={{ id: 42, name: 'Current', type: 'AUTHOR' }}
        />
      </IntlProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));

    expect(state.mutate).toHaveBeenCalledWith(
      { id: 42, entityId: 43 },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(state.navigate).not.toHaveBeenCalled();

    const [, { onSuccess }] = state.mutate.mock.calls[0];
    onSuccess();
    expect(state.navigate).toHaveBeenCalledWith('/ui/persons/43', {
      replace: true
    });
  });
});
