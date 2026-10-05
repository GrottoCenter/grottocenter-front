import fc from 'fast-check';
import { enqueueSnackbar } from 'notistack';

import store from '@/store';
import queryClient from './queryClient';

vi.mock('@/store', () => ({
  default: { getState: vi.fn(), dispatch: vi.fn() }
}));
vi.mock('@/actions/Login', () => ({
  postLogout: () => ({ type: 'POST_LOGOUT' })
}));
vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }));

describe('query retry policy', () => {
  const { retry } = queryClient.getDefaultOptions().queries;

  it.each([400, 401, 403, 404, 408, 409, 422, 429, 499])(
    'never retries HTTP %i',
    status => {
      expect(retry(0, { status })).toBe(false);
      expect(retry(1, { status })).toBe(false);
    }
  );

  it('retries server errors once across the full HTTP error range', () => {
    fc.assert(
      fc.property(fc.integer({ min: 400, max: 599 }), status => {
        expect(retry(0, { status })).toBe(status >= 500);
        expect(retry(1, { status })).toBe(false);
      })
    );
  });

  it.each([500, 503, 599])('retries HTTP %i only once', status => {
    expect(retry(0, { status })).toBe(true);
    expect(retry(1, { status })).toBe(false);
  });

  it('retries a status-less network error only once', () => {
    const error = new TypeError('Failed to fetch');
    expect(retry(0, error)).toBe(true);
    expect(retry(1, error)).toBe(false);
  });
});

describe('global query and mutation error notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.getState.mockReturnValue({
      intl: {
        locale: 'fr',
        messages: { fr: { 'Too many requests': 'Trop de requêtes' } }
      }
    });
  });

  it.each(['query', 'mutation'])(
    'shows a translated, deduplicated 429 toast for a %s',
    source => {
      const error = { status: 429, body: { code: 'RATE_LIMIT_EXCEEDED' } };
      if (source === 'query') {
        queryClient.getQueryCache().config.onError(error, {});
      } else {
        queryClient.getMutationCache().config.onError(error, null, null, {});
      }

      expect(enqueueSnackbar).toHaveBeenCalledExactlyOnceWith(
        'Trop de requêtes',
        { variant: 'error', preventDuplicate: true }
      );
      expect(store.dispatch).not.toHaveBeenCalled();
    }
  );

  it('falls back to the English 429 message without a loaded translation', () => {
    store.getState.mockReturnValue({ intl: { locale: 'fr', messages: {} } });

    queryClient.getQueryCache().config.onError({ status: 429 }, {});

    expect(enqueueSnackbar).toHaveBeenCalledExactlyOnceWith(
      'Too many requests',
      { variant: 'error', preventDuplicate: true }
    );
  });

  it('still handles 401 as session loss without a toast', () => {
    queryClient.getQueryCache().config.onError({ status: 401 }, {});

    expect(store.dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'POST_LOGOUT'
    });
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });
});
