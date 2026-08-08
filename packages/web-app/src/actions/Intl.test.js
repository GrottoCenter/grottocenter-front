import fetch from 'isomorphic-fetch';
import {
  changeLocale,
  hasLoadedMessages,
  CHANGE_LOCALE,
  CHANGE_LOCALE_LOAD_SUCCESS
} from './Intl';

// The action imports fetch as a default export, so the factory has to return
// `{ default: ... }` — a bare function would leave the import undefined.
vi.mock('isomorphic-fetch', () => ({ default: vi.fn() }));

const makeStore = messages => ({
  dispatch: vi.fn(),
  getState: () => ({ intl: { messages } })
});

const okResponse = body =>
  Promise.resolve({ status: 200, json: () => Promise.resolve(body) });

describe('hasLoadedMessages', () => {
  it('is true for a locale carrying messages', () => {
    expect(hasLoadedMessages({ fr: { Hello: 'Bonjour' } }, 'fr')).toBe(true);
  });

  it('is false for a locale that was never loaded', () => {
    expect(hasLoadedMessages({}, 'fr')).toBe(false);
    expect(hasLoadedMessages(undefined, 'fr')).toBe(false);
  });

  // The whole point: a failed fetch used to store {} here, and the old `in`
  // guard then treated the locale as loaded forever — the UI stayed on raw
  // message ids until a full reload, even once the connection was back.
  it('is false for the empty object a failed fetch leaves behind', () => {
    expect(hasLoadedMessages({ fr: {} }, 'fr')).toBe(false);
  });
});

describe('changeLocale', () => {
  beforeEach(() => fetch.mockReset());

  it('does not refetch a locale that is already loaded', async () => {
    const { dispatch, getState } = makeStore({ fr: { Hello: 'Bonjour' } });

    await changeLocale('fr')(dispatch, getState);

    expect(fetch).not.toHaveBeenCalled();
  });

  it('retries a locale whose previous load left it empty', async () => {
    const { dispatch, getState } = makeStore({ fr: {} });
    fetch.mockReturnValue(okResponse({ Hello: 'Bonjour' }));

    await changeLocale('fr')(dispatch, getState);

    expect(fetch).toHaveBeenCalledWith('/lang/fr.json');
    expect(dispatch).toHaveBeenCalledWith({ type: CHANGE_LOCALE });
    expect(dispatch).toHaveBeenCalledWith({
      type: CHANGE_LOCALE_LOAD_SUCCESS,
      locale: 'fr',
      messages: { Hello: 'Bonjour' }
    });
  });
});
