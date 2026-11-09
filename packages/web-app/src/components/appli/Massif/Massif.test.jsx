import { act, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiGet } from '@/api/client';
import { statsKeys } from '@/api/queryKeys';
import { getStatisticsMassifUrl } from '@/conf/apiRoutes';
import {
  createTestQueryClient,
  renderWithProviders
} from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import Massif from './Massif';

vi.mock('@/api/client', () => ({ apiGet: vi.fn() }));
vi.mock('@/hooks', async importOriginal => {
  const mutation = () => ({ isPending: false, error: null });
  return {
    ...(await importOriginal()),
    usePermissions: () => ({ isAuth: true, isAdmin: true }),
    useSubscriptions: () => ({ isSubscribed: () => false }),
    useDeleteMassif: mutation,
    useRestoreMassif: mutation,
    useSubscribeToMassif: mutation,
    useUnsubscribeFromMassif: mutation
  };
});
vi.mock('./MapMassif', () => ({ default: () => null }));
vi.mock('./Documents', () => ({ default: () => null }));
vi.mock('@/components/appli/Descriptions', () => ({ default: () => null }));
vi.mock('@/components/appli/Guidelines', () => ({ default: () => null }));
vi.mock('@/components/appli/OrganizationAssociation', () => ({
  default: () => null
}));
vi.mock('@/components/appli/RecentChanges/Section', () => ({
  default: () => null
}));
vi.mock('@/components/common/card/Deleted', async () => {
  const { DELETED_ENTITIES } = await import('@/utils/deletedEntityTypes');
  return {
    DELETED_ENTITIES,
    DeletedCard: () => <p>Deleted massif</p>,
    DeleteConfirmationDialog: () => null
  };
});

const massif = { id: 7, name: 'Test massif', isDeleted: false };
const statisticsKey = statsKeys.massif(7);
const statisticsUrl = getStatisticsMassifUrl(7);
const view = (entity, isLoading = false, isPreview = false) => (
  <MemoryRouter initialEntries={['/ui/massifs/7']}>
    <Routes>
      <Route
        path="/ui/massifs/:massifId"
        element={
          <Massif massif={entity} isLoading={isLoading} isPreview={isPreview} />
        }
      />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  apiGet.mockResolvedValue({ nb_caves: 0 });
});

it('renders the complete massif preview without page actions or navigation tabs', () => {
  renderWithProviders(view({ ...massif, isDeleted: true }, false, true), {
    messages
  });
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    massif.name
  );
  expect(screen.getByText('Deleted massif')).toBeVisible();
  expect(screen.getByRole('button', { name: /Entrances list$/ })).toBeVisible();
  expect(screen.queryByTestId('action-pdf')).toBeNull();
  expect(screen.queryByRole('tab')).toBeNull();
  expect(apiGet).not.toHaveBeenCalled();
});

it('fetches statistics while the route massif details are still loading', async () => {
  renderWithProviders(view(undefined, true), { messages });
  await waitFor(() =>
    expect(apiGet).toHaveBeenCalledWith(statisticsUrl, {
      signal: expect.any(AbortSignal)
    })
  );
  expect(screen.queryByText(messages['More information'])).toBeNull();
});

it('does not fetch statistics in preview while loading or after receiving a deleted massif', async () => {
  const { rerender, queryClient } = renderWithProviders(
    view(undefined, true, true),
    { messages }
  );
  expect(apiGet).not.toHaveBeenCalled();
  rerender(view({ ...massif, isDeleted: true }, false, true));
  expect(screen.getByText('Deleted massif')).toBeVisible();
  await act(() => queryClient.invalidateQueries({ queryKey: statisticsKey }));
  expect(apiGet).not.toHaveBeenCalled();
  expect(screen.queryByText(messages['More information'])).toBeNull();
});

it('does not show cached active statistics on a deleted massif', () => {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(statisticsKey, { nb_caves: 17 });
  renderWithProviders(view({ ...massif, isDeleted: true }), {
    messages,
    queryClient
  });
  expect(screen.getByText('Deleted massif')).toBeVisible();
  expect(screen.queryByText(messages['More information'])).toBeNull();
  expect(screen.getByRole('button', { name: /Entrances list$/ })).toBeVisible();
  expect(apiGet).not.toHaveBeenCalled();
});

it('stops fetching after deletion and resumes statistics after restoration', async () => {
  const { rerender, queryClient } = renderWithProviders(view(massif), {
    messages
  });
  await waitFor(() =>
    expect(apiGet).toHaveBeenCalledWith(statisticsUrl, {
      signal: expect.any(AbortSignal)
    })
  );
  expect(apiGet).toHaveBeenCalledTimes(1);
  expect(screen.getByText(messages['More information'])).toBeVisible();

  rerender(view({ ...massif, isDeleted: true }));
  await act(() => queryClient.invalidateQueries({ queryKey: statisticsKey }));
  expect(apiGet).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(messages['More information'])).toBeNull();

  rerender(view(massif));
  await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(2));
  expect(apiGet).toHaveBeenLastCalledWith(statisticsUrl, {
    signal: expect.any(AbortSignal)
  });
  expect(screen.getByText(messages['More information'])).toBeVisible();
});

it('cancels an ongoing statistics request when the massif is deleted', async () => {
  let requestSignal;
  apiGet.mockImplementation((_url, { signal }) => {
    requestSignal = signal;
    return new Promise(() => {});
  });
  const { rerender } = renderWithProviders(view(massif), { messages });
  await waitFor(() => expect(requestSignal).toBeInstanceOf(AbortSignal));
  expect(requestSignal.aborted).toBe(false);
  rerender(view({ ...massif, isDeleted: true }));
  await waitFor(() => expect(requestSignal.aborted).toBe(true));
  expect(apiGet).toHaveBeenCalledTimes(1);
});
