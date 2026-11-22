import { fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import PersonEdit from './index';

const state = vi.hoisted(() => ({
  query: {},
  isOnline: true,
  permissions: { isAdmin: true, isModerator: false }
}));

vi.mock('@/hooks', () => ({
  usePerson: () => state.query,
  useUserProperties: () => ({ id: 99 }),
  usePermissions: () => state.permissions,
  useOnlineStatus: () => state.isOnline
}));
vi.mock('@/components/common/Layouts/Fixed/FixedContent', () => ({
  default: ({ content }) => <main>{content}</main>
}));
vi.mock('@/components/appli/EntitiesForm/Person', () => ({
  default: () => <p>Editable person</p>
}));

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/ui/persons/42/edit']}>
      <Routes>
        <Route path="/ui/persons/:personId/edit" element={<PersonEdit />} />
      </Routes>
    </MemoryRouter>,
    { messages }
  );

beforeEach(() => {
  state.query = {
    data: undefined,
    isFetching: false,
    error: null,
    fetchStatus: 'idle',
    refetch: vi.fn()
  };
  state.isOnline = true;
  state.permissions = { isAdmin: true, isModerator: false };
});

it('uses the shared fetch error and retries the person request', () => {
  state.query.error = new Error('Request failed');
  renderPage();
  expect(screen.getByTestId('fetch-error-state')).toHaveTextContent(
    messages['Error, the person you are looking for is not available.']
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(state.query.refetch).toHaveBeenCalledTimes(1);
});

it('shows an offline state instead of reporting a paused person request as missing', () => {
  state.query.fetchStatus = 'paused';
  state.isOnline = false;
  renderPage();
  expect(screen.getByTestId('fetch-error-state')).toHaveTextContent(
    messages.offlineContentUnavailable
  );
  expect(
    screen.queryByText(
      messages["The person you are looking for doesn't exist."]
    )
  ).toBeNull();
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});

it('preserves the missing-person fallback when there is no fetch error', () => {
  renderPage();
  expect(
    screen.getByText(messages["The person you are looking for doesn't exist."])
  ).toBeVisible();
  expect(screen.queryByTestId('fetch-error-state')).toBeNull();
});

it('keeps access restrictions ahead of fetch errors', () => {
  state.permissions = { isAdmin: false, isModerator: false };
  state.query.error = new Error('Request failed');
  renderPage();
  expect(
    screen.getByText(messages['You are not authorized to edit this person.'])
  ).toBeVisible();
  expect(screen.queryByTestId('fetch-error-state')).toBeNull();
});
