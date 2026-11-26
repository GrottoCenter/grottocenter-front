import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '@/test/renderWithProviders';
import { apiGet, apiGetWithRange } from '@/api/client';
import { useCleanupSession } from './useCleanupSession';
import { requireSessionSnapshot, sessionSnapshotKey } from './session';
import { makeDocument } from './fixtures';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiGetWithRange: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn()
}));

let deleted;

const Probe = ({ accountId }) => {
  const session = useCleanupSession(accountId);
  const queryClient = useQueryClient();
  return (
    <>
      <p>{session.isReady ? 'ready' : 'blocked'}</p>
      <p>{session.error?.message}</p>
      <button
        type="button"
        onClick={session.refresh}
        disabled={session.isFetching}>
        Refresh
      </button>
      <button type="button" onClick={() => queryClient.invalidateQueries()}>
        Invalidate all
      </button>
    </>
  );
};

const renderSession = (accountId = 1) =>
  renderWithProviders(<Probe accountId={accountId} />);

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  deleted = [];
  apiGetWithRange.mockImplementation(async url => {
    const rows = url.includes('isDeleted=true') ? deleted : [];
    const skip = Number(new URL(url).searchParams.get('skip'));
    return {
      data: { documents: rows.slice(skip, skip + 100) },
      contentRange: rows.length
        ? `documents ${skip}-${Math.min(skip + 99, rows.length - 1)}/${rows.length}`
        : null
    };
  });
});

afterEach(() => vi.restoreAllMocks());

it('shares one analysis across entity invalidations, navigation and page reloads', async () => {
  const first = renderSession();
  await screen.findByText('ready');
  expect(apiGetWithRange).toHaveBeenCalledTimes(2);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Invalidate all' }));
  });
  expect(apiGetWithRange).toHaveBeenCalledTimes(2);
  first.unmount();
  renderSession();
  expect(screen.getByText('ready')).toBeVisible();
  expect(apiGetWithRange).toHaveBeenCalledTimes(2);
});

it('does not restart an in-flight global scan on a StrictMode remount', async () => {
  let finishFirstPage;
  apiGetWithRange.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishFirstPage = resolve;
      })
  );
  renderWithProviders(
    <StrictMode>
      <Probe accountId={1} />
    </StrictMode>
  );
  await waitFor(() => expect(apiGetWithRange).toHaveBeenCalledTimes(1));
  await act(async () => {
    finishFirstPage({ data: { documents: [] }, contentRange: null });
  });
  await screen.findByText('ready');
  expect(apiGetWithRange).toHaveBeenCalledTimes(2);
});

it('persists only the compact blocker index after scanning all pages', async () => {
  deleted = Array.from({ length: 650 }, (_, index) =>
    makeDocument({ id: index + 1, isDeleted: true })
  );
  const { queryClient } = renderSession();
  await screen.findByText('ready');
  expect(apiGetWithRange).toHaveBeenCalledTimes(8);
  expect(requireSessionSnapshot(queryClient, 1).deleted).toEqual({ 42: 650 });
  const stored = sessionStorage.getItem(sessionSnapshotKey(1));
  expect(stored.length).toBeLessThan(500);
  expect(stored).not.toContain('A cave survey');
});

it('changes the shared result only after an explicit successful refresh', async () => {
  const { queryClient } = renderSession();
  await screen.findByText('ready');
  deleted = [makeDocument({ isDeleted: true })];
  expect(requireSessionSnapshot(queryClient, 1).deleted).toEqual({});
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() =>
    expect(requireSessionSnapshot(queryClient, 1).deleted).toEqual({ 42: 1 })
  );
  expect(apiGetWithRange).toHaveBeenCalledTimes(4);
});

it('blocks conversion during a refresh and after a failed refresh, including after reload', async () => {
  const first = renderSession();
  await screen.findByText('ready');
  let rejectRefresh;
  apiGetWithRange.mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        rejectRefresh = reject;
      })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await screen.findByText('blocked');
  expect(() => requireSessionSnapshot(first.queryClient, 1)).toThrow(
    'sessionUnavailable'
  );
  await act(async () => {
    rejectRefresh(new Error('Refresh failed'));
  });
  await screen.findByText('Refresh failed');
  expect(screen.getByText('blocked')).toBeVisible();
  expect(sessionStorage.getItem(sessionSnapshotKey(1))).toBeNull();
  first.unmount();
  renderSession();
  await screen.findByText('ready');
  expect(apiGetWithRange).toHaveBeenCalledTimes(5);
});

it('does not reuse the privileged snapshot for another account', async () => {
  const first = renderSession(1);
  await screen.findByText('ready');
  first.unmount();
  renderSession(2);
  await screen.findByText('ready');
  expect(apiGetWithRange).toHaveBeenCalledTimes(4);
});

it('rejects malformed persisted snapshots instead of treating them as an empty check', async () => {
  sessionStorage.setItem(
    sessionSnapshotKey(1),
    JSON.stringify({
      version: 1,
      analyzedAt: Date.now(),
      deleted: {},
      pending: { 42: 'unknown' }
    })
  );
  renderSession();
  await screen.findByText('ready');
  expect(apiGetWithRange).toHaveBeenCalledTimes(2);
});

it('retains the shared in-memory result if session storage is unavailable', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked');
  });
  const { queryClient } = renderSession();
  await screen.findByText('ready');
  await act(async () => {
    await queryClient.invalidateQueries();
  });
  expect(requireSessionSnapshot(queryClient, 1).deleted).toEqual({});
  expect(apiGetWithRange).toHaveBeenCalledTimes(2);
});

it('does not publish a partial analysis when a later page fails', async () => {
  deleted = Array.from({ length: 101 }, (_, index) =>
    makeDocument({ id: index + 1, isDeleted: true })
  );
  const respond = apiGetWithRange.getMockImplementation();
  apiGetWithRange.mockImplementation(url =>
    url.includes('skip=100')
      ? Promise.reject(new Error('Second page failed'))
      : respond(url)
  );
  renderSession();
  await screen.findByText('Second page failed');
  expect(screen.getByText('blocked')).toBeVisible();
  expect(sessionStorage.getItem(sessionSnapshotKey(1))).toBeNull();
  expect(apiGet).not.toHaveBeenCalled();
});
