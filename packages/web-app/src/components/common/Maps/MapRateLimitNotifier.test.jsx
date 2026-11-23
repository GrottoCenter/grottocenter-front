import { StrictMode } from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import {
  mapFetch,
  _resetForTests,
  getMapRateLimit,
  observeMapRateLimit
} from '@/api/mapClient';
import store from '@/store';
import { logout, fetchLoginSuccess } from '@/actions/Login';
import { renderWithProviders } from '@/test/renderWithProviders';
import en from '../../../../public/lang/en.json';
import fr from '../../../../public/lang/fr.json';
import AppSnackbar from '../AppSnackbar';
import MapRateLimitNotifier from './MapRateLimitNotifier';

const components = { warning: AppSnackbar };
const onToastClose = vi.fn();
let stopMonitoring;
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
  store.dispatch(logout());
  stopMonitoring = observeMapRateLimit();
  onToastClose.mockClear();
  vi.useFakeTimers();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
});

afterEach(() => {
  stopMonitoring();
  act(() => store.dispatch(logout()));
  _resetForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('offers login, closes the visitor warning on login and keeps a subsequent authenticated pause through logout', async () => {
  const view = renderWithProviders(tree(), { messages: en, store });
  await limitMap();
  expect(screen.getAllByText(en['mapRateLimit.anonymous'])).toHaveLength(1);
  fireEvent.click(screen.getByTestId('map-rate-limit-login'));
  expect(store.getState().login.isLoginDialogDisplayed).toBe(true);
  act(() => store.dispatch(fetchLoginSuccess({ id: 1 }, 'session')));
  expect(getMapRateLimit().retryAt).toBeLessThanOrEqual(Date.now());
  await act(() => vi.advanceTimersByTimeAsync(1000));
  // Notistack starts its collapse after React commits the slide's exit.
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(
    screen.queryByText(en['mapRateLimit.anonymous'])
  ).not.toBeInTheDocument();
  expect(screen.getByTestId('app-snackbar')).not.toBeVisible();

  await limitMap();
  expect(screen.getByRole('alert')).toHaveTextContent(
    en['mapRateLimit.authenticated']
  );
  expect(screen.queryByTestId('map-rate-limit-login')).not.toBeInTheDocument();
  const deadline = getMapRateLimit().retryAt;
  act(() => store.dispatch(logout()));
  expect(getMapRateLimit().retryAt).toBe(deadline);
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await act(() => vi.advanceTimersByTimeAsync(1000));
  view.unmount();
  renderWithProviders(tree(), { messages: en, store });
  await act(async () => {});
  expect(
    screen.queryByText(en['mapRateLimit.anonymous'])
  ).not.toBeInTheDocument();
});

it('counts down a server deadline and closes at expiry', async () => {
  store.dispatch(fetchLoginSuccess({ id: 1 }, 'session'));
  renderWithProviders(tree(), { messages: en, store });
  await limitMap('120');
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

it('renders the French copy without inventing a retry time for the fallback', async () => {
  renderWithProviders(tree(), { messages: fr, locale: 'fr', store });
  await limitMap();
  expect(screen.getByText(fr['mapRateLimit.anonymous'])).toBeVisible();
  expect(screen.queryByText(/10 minutes/)).not.toBeInTheDocument();
});

it('announces a new cooldown while the previous toast is exiting', async () => {
  renderWithProviders(tree(), { messages: en, store });
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
