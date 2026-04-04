import fc from 'fast-check';
import { LOGOUT, FETCH_LOGIN_SUCCESS } from '../actions/Login';

/**
 * Property 9: Logout clears auth state
 *
 * For any Redux login state containing an auth token, dispatching the LOGOUT
 * action produces a state where authToken is undefined, authorizationHeader
 * is undefined, and authTokenDecoded is null.
 *
 * Encodes: logout always fully clears authentication state regardless of
 * what was stored before.
 * Covers: random login states with varying tokens and decoded payloads.
 *
 * Validates: Requirements 5.1
 */

// We need to mock window.localStorage before importing the reducer,
// because the reducer module calls getRawTokenIfNotExpired() at import time.
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] ?? null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Import reducer after localStorage mock is in place
const reducer = require('./LoginReducer').default;

describe('Property 9: Logout clears auth state', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  const tokenArb = fc
    .record({
      id: fc.integer({ min: 1, max: 100000 }),
      nickname: fc.string({ minLength: 1, maxLength: 20 }),
      groups: fc.array(
        fc.record({
          id: fc.integer({ min: 1, max: 10 }),
          name: fc.string({ minLength: 1, maxLength: 20 })
        }),
        { minLength: 0, maxLength: 5 }
      )
    })
    .map(decoded => ({
      token: `fake.${btoa(JSON.stringify(decoded))}.sig`,
      decoded
    }));

  const loginStateArb = fc
    .tuple(
      tokenArb,
      fc.boolean(),
      fc.boolean(),
      fc.option(
        fc.string({ minLength: 1, maxLength: 50 }).map(msg => new Error(msg)),
        { nil: null }
      )
    )
    .map(([{ token, decoded }, isFetching, isLoginDialogDisplayed, error]) => ({
      authToken: token,
      authorizationHeader: { Authorization: `Bearer ${token}` },
      authTokenDecoded: decoded,
      error,
      isFetching,
      isLoginDialogDisplayed,
      isMustResetMessageDisplayed: false
    }));

  it('clears authToken, authorizationHeader, and authTokenDecoded for any login state', () => {
    fc.assert(
      fc.property(loginStateArb, loginState => {
        const nextState = reducer(loginState, { type: LOGOUT });

        expect(nextState.authToken).toBeUndefined();
        expect(nextState.authorizationHeader).toBeUndefined();
        expect(nextState.authTokenDecoded).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('preserves non-auth fields after LOGOUT for any login state', () => {
    fc.assert(
      fc.property(loginStateArb, loginState => {
        const nextState = reducer(loginState, { type: LOGOUT });

        expect(nextState.error).toBe(loginState.error);
        expect(nextState.isFetching).toBe(loginState.isFetching);
        expect(nextState.isLoginDialogDisplayed).toBe(
          loginState.isLoginDialogDisplayed
        );
      }),
      { numRuns: 100 }
    );
  });

  it('clears auth state after a successful login followed by LOGOUT', () => {
    fc.assert(
      fc.property(tokenArb, ({ token, decoded }) => {
        // Simulate a login success first
        const loggedInState = reducer(undefined, {
          type: FETCH_LOGIN_SUCCESS,
          token,
          tokenDecoded: decoded
        });

        // Then logout
        const loggedOutState = reducer(loggedInState, { type: LOGOUT });

        expect(loggedOutState.authToken).toBeUndefined();
        expect(loggedOutState.authorizationHeader).toBeUndefined();
        expect(loggedOutState.authTokenDecoded).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
