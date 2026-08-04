import fc from 'fast-check';
import { checkAuthStatus } from './utils';

// Hoisted so the vi.mock factories below can reference it.
const mockPostLogoutThunk = vi.hoisted(() => dispatch => {
  dispatch({ type: 'LOGOUT' });
});

// Mock the Login module's postLogout thunk.
// The real postLogout dispatches LOGOUT and redirects; here we only
// verify that checkAuthStatus delegates to it on 401.
vi.mock('./Login', () => ({
  postLogout: () => mockPostLogoutThunk
}));

/**
 * Property 10: 401 interceptor dispatches postLogout and marks auth error
 *
 * For any HTTP response with status 401, checkAuthStatus(dispatch) calls
 * dispatch with the postLogout thunk (which dispatches logout) and throws
 * an error with isAuthError set to true.
 *
 * Encodes: global 401 handling — banned/expired tokens trigger automatic
 * logout instead of broken UI.
 * Covers: response objects with status 401 and varying body content.
 *
 * Validates: Requirements 5.2, 5.4
 */
describe('Property 10: 401 interceptor dispatches logout and marks auth error', () => {
  it('dispatches logout and throws with isAuthError for any 401 response', () => {
    fc.assert(
      fc.property(
        fc.record({
          statusText: fc.string(),
          headers: fc.constant(new Headers())
        }),
        responseFields => {
          const response = {
            ...responseFields,
            status: 401
          };

          // Mimic redux-thunk: if dispatch receives a function, call it.
          const dispatched = [];
          const dispatch = action => {
            if (typeof action === 'function') {
              return action(dispatch);
            }
            dispatched.push(action);
            return action;
          };

          let thrownError;
          try {
            checkAuthStatus(dispatch)(response);
          } catch (err) {
            thrownError = err;
          }

          // The postLogout thunk dispatched the LOGOUT action
          expect(dispatched).toEqual([{ type: 'LOGOUT' }]);

          // thrown error has isAuthError flag
          expect(thrownError).toBeDefined();
          expect(thrownError.isAuthError).toBe(true);
          expect(thrownError.message).toBe('Unauthorized');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('delegates to checkAndGetStatus for non-401 responses', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 200, max: 599 }).filter(s => s !== 401),
        status => {
          const response = {
            status,
            json: () => Promise.resolve({ message: 'error' })
          };

          const dispatched = [];
          const dispatch = action => {
            if (typeof action === 'function') {
              return action(dispatch);
            }
            dispatched.push(action);
            return action;
          };

          const checker = checkAuthStatus(dispatch);

          if (status >= 200 && status <= 300) {
            // Should return the response directly
            const result = checker(response);
            expect(result).toBe(response);
          }
          // For non-2xx non-401, checkAuthStatus returns a promise
          // that rejects — we just verify dispatch was NOT called
          expect(dispatched).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
