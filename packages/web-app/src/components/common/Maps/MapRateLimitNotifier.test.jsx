import { StrictMode } from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { mapFetch, _resetForTests, getMapRateLimit } from '@/api/mapClient';
import { logout, fetchLoginSuccess } from '@/actions/Login';
import { renderWithProviders } from '@/test/renderWithProviders';
import en from '../../../../public/lang/en.json';
import fr from '../../../../public/lang/fr.json';
import AppSnackbar from '../AppSnackbar';
import MapRateLimitNotifier from './MapRateLimitNotifier';

const components = { warning: AppSnackbar };
const onToastClose = vi.fn();
const tree = () => (
  <StrictMode>
    <SnackbarProvider Components={components} onClose={onToastClose}>
      <MapRateLimitNotifier />
    </SnackbarProvider>
  </StrictMode>
);

const limitMap = async (retryAfter = null) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: retryAfter ? { 'Retry-After': retryAfter } : {}
      })
    )
  );
  await act(() => mapFetch('/api/v1/geoloc/entrances'));
};

beforeEach(() => {
  _resetForTests();
  onToastClose.mockClear();
  vi.useFakeTimers();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
});

afterEach(() => {
  _resetForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('offers login once, preserves the cooldown through session changes and stays dismissed on remount', async () => {
  const view = renderWithProviders(tree(), { messages: en });
  await limitMap();
  expect(screen.getAllByText(en['mapRateLimit.anonymous'])).toHaveLength(1);
  fireEvent.click(screen.getByTestId('map-rate-limit-login'));
  expect(view.store.getState().login.isLoginDialogDisplayed).toBe(true);

  const deadline = getMapRateLimit().retryAt;
  act(() => view.store.dispatch(fetchLoginSuccess({ id: 1 }, 'session')));
  expect(screen.getByText(en['mapRateLimit.authenticated'])).toBeVisible();
  expect(screen.queryByTestId('map-rate-limit-login')).not.toBeInTheDocument();
  expect(getMapRateLimit().retryAt).toBe(deadline);

  act(() => view.store.dispatch(logout()));
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  act(() => vi.advanceTimersByTime(1000));
  view.unmount();
  renderWithProviders(tree(), { messages: en, store: view.store });
  await act(async () => {});
  expect(
    screen.queryByText(en['mapRateLimit.anonymous'])
  ).not.toBeInTheDocument();
});

it('counts down a server deadline, follows login and closes at expiry', async () => {
  const view = renderWithProviders(tree(), { messages: en });
  await limitMap('120');
  expect(screen.getByText(/Sign in or try again in 2 minutes/)).toBeVisible();
  // IntlProvider and Redux changes must update the already enqueued nodes.
  view.rerender(tree());
  act(() => view.store.dispatch(fetchLoginSuccess({ id: 1 }, 'session')));
  expect(screen.getByText(/Try again in 2 minutes/)).toBeVisible();
  act(() => vi.advanceTimersByTime(60000));
  expect(screen.getByText(/Try again in 1 minute/)).toBeVisible();
  act(() => vi.advanceTimersByTime(61000));
  // Allow notistack's exit transition after React processes expiry.
  await act(() => vi.runAllTimersAsync());
  expect(onToastClose).toHaveBeenCalledWith(
    null,
    'instructed',
    'map-rate-limit-1'
  );
});

it('renders the French copy and does not invent a retry time for the fallback', async () => {
  renderWithProviders(tree(), { messages: fr, locale: 'fr' });
  await limitMap();
  expect(screen.getByText(fr['mapRateLimit.anonymous'])).toBeVisible();
  expect(screen.queryByText(/10 minutes/)).not.toBeInTheDocument();
});

it('announces a new cooldown even while the previous toast is exiting', async () => {
  renderWithProviders(tree(), { messages: en });
  await limitMap('1');
  act(() => vi.advanceTimersByTime(1000));
  await limitMap('120');
  act(() => vi.advanceTimersByTime(1000));
  expect(onToastClose).toHaveBeenCalledWith(
    null,
    'instructed',
    'map-rate-limit-1'
  );
  expect(
    screen.getAllByText(/Sign in or try again in 2 minutes/).length
  ).toBeGreaterThan(0);
});

it('observes background 429 messages only from the controlling worker', async () => {
  const controller = {};
  const worker = new EventTarget();
  worker.controller = controller;
  vi.stubGlobal('navigator', { serviceWorker: worker, onLine: true });
  renderWithProviders(tree(), { messages: en });
  const data = {
    type: 'grottocenter-map-rate-limit',
    retryAt: Date.now() + 120000,
    hasServerDeadline: true
  };
  act(() => worker.dispatchEvent(new MessageEvent('message', { data })));
  expect(getMapRateLimit()).toBeNull();
  act(() =>
    worker.dispatchEvent(
      new MessageEvent('message', { data, source: controller })
    )
  );
  expect(screen.getAllByText(/Sign in or try again in 2 minutes/)).toHaveLength(
    1
  );
  act(() =>
    worker.dispatchEvent(
      new MessageEvent('message', { data, source: controller })
    )
  );
  expect(screen.getAllByText(/Sign in or try again in 2 minutes/)).toHaveLength(
    1
  );
});
