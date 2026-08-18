import fc from 'fast-check';
import {
  CLEAR_IMPERSONATION,
  FETCH_LOGIN_SUCCESS,
  LOGOUT,
  SET_IMPERSONATED_ROLE
} from '../actions/Login';
import {
  IMPERSONATABLE_ROLES,
  IMPERSONATED_ROLE_KEY
} from '../utils/impersonation';

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
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Import reducer after localStorage mock is in place (top-level await keeps
// the import order so getRawTokenIfNotExpired() sees the mocked localStorage).
const reducer = (await import('./LoginReducer')).default;

describe('Property 9: Logout clears auth state', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
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

describe('Impersonation state', () => {
  const impersonatedRoleArb = fc.constantFrom(...IMPERSONATABLE_ROLES);
  const optionalImpersonatedRoleArb = fc.option(impersonatedRoleArb, {
    nil: null
  });
  const unsupportedRoleArb = fc
    .string()
    .filter(roleName => !IMPERSONATABLE_ROLES.includes(roleName));

  beforeEach(() => {
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  it('persists any supported role in session storage', () => {
    fc.assert(
      fc.property(
        optionalImpersonatedRoleArb,
        impersonatedRoleArb,
        (currentRole, roleName) => {
          const nextState = reducer(
            { impersonatedRole: currentRole },
            { type: SET_IMPERSONATED_ROLE, roleName }
          );

          expect(nextState.impersonatedRole).toBe(roleName);
          expect(sessionStorageMock.setItem).toHaveBeenLastCalledWith(
            IMPERSONATED_ROLE_KEY,
            roleName
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ignores any unsupported role', () => {
    fc.assert(
      fc.property(
        optionalImpersonatedRoleArb,
        unsupportedRoleArb,
        (currentRole, roleName) => {
          const state = { impersonatedRole: currentRole };
          const nextState = reducer(state, {
            type: SET_IMPERSONATED_ROLE,
            roleName
          });

          expect(nextState).toBe(state);
        }
      ),
      { numRuns: 100 }
    );
    expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('clears any preview explicitly and after login', () => {
    fc.assert(
      fc.property(impersonatedRoleArb, impersonatedRole => {
        const impersonatedState = { impersonatedRole };
        const clearedState = reducer(impersonatedState, {
          type: CLEAR_IMPERSONATION
        });
        const loggedInState = reducer(impersonatedState, {
          type: FETCH_LOGIN_SUCCESS,
          token: 'token',
          tokenDecoded: { groups: [{ name: 'User' }] }
        });

        expect(clearedState.impersonatedRole).toBeNull();
        expect(loggedInState.impersonatedRole).toBeNull();
      }),
      { numRuns: 100 }
    );
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
      IMPERSONATED_ROLE_KEY
    );
  });
});
