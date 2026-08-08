import { isNetworkError } from './networkError';

const setOnLine = value => {
  Object.defineProperty(window.navigator, 'onLine', {
    value,
    configurable: true
  });
};

describe('isNetworkError', () => {
  beforeEach(() => setOnLine(true));

  it('returns false for no error', () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });

  describe('raw Error shape (thunks like GetEntrance)', () => {
    it.each([
      ['Chrome', 'Failed to fetch'],
      ['Firefox', 'NetworkError when attempting to fetch resource.'],
      ['Safari', 'Load failed'],
      ['WebView', 'Network request failed']
    ])('detects the %s wording', (_engine, message) => {
      expect(isNetworkError(new TypeError(message))).toBe(true);
    });

    it('ignores an unrelated error message', () => {
      expect(isNetworkError(new Error('Something else went wrong'))).toBe(
        false
      );
    });
  });

  describe('makeErrorMessage shape { type, message }', () => {
    it('reads the original message from `type`', () => {
      // makeErrorMessage(error.message, 'Fetching entrances') puts the original
      // failure in `type` and the context label in `message`.
      expect(
        isNetworkError({ type: 'Failed to fetch', message: 'Fetching caves' })
      ).toBe(true);
    });

    it('is false for an HTTP status carried in `type`', () => {
      expect(isNetworkError({ type: '500', message: 'Fetching caves' })).toBe(
        false
      );
    });
  });

  describe('structured API shape { code, message, status }', () => {
    // The status guard must win outright: a 404 received before losing
    // connectivity is still a 404 while offline, and labelling it "not
    // available offline" would send the user chasing a network problem that
    // does not exist.
    it.each([404, 500, 409])('returns false for status %i', status => {
      setOnLine(false);
      expect(
        isNetworkError({ code: 'NOT_FOUND', message: 'Not found', status })
      ).toBe(false);
    });
  });

  it('falls back to navigator.onLine for unrecognised shapes', () => {
    setOnLine(false);
    expect(isNetworkError({ weird: true })).toBe(true);
    setOnLine(true);
    expect(isNetworkError({ weird: true })).toBe(false);
  });

  it('handles a bare message string (Region reducer)', () => {
    expect(isNetworkError('Failed to fetch')).toBe(true);
    expect(isNetworkError('Not found')).toBe(false);
  });
});
