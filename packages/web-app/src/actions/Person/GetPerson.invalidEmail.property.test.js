import fc from 'fast-check';
import fetch from 'isomorphic-fetch';
import { fetchInvalidEmailCavers } from './GetPerson';

// Hoisted so the vi.mock factories below can reference it.
const mockPostLogoutThunk = vi.hoisted(() => dispatch => {
  dispatch({ type: 'LOGOUT' });
});

// Mock isomorphic-fetch
vi.mock('isomorphic-fetch', () => ({ default: vi.fn() }));

// Mock the Login module
vi.mock('../Login', () => ({
  postLogout: () => mockPostLogoutThunk
}));

const caverArb = fc.record({
  id: fc.integer({ min: 1, max: 999999 }),
  name: fc.string({ minLength: 0, maxLength: 30 }),
  surname: fc.string({ minLength: 0, maxLength: 30 }),
  nickname: fc.string({ minLength: 0, maxLength: 30 })
});

const caversArrayArb = fc.array(caverArb, {
  minLength: 0,
  maxLength: 20
});

const getState = () => ({
  login: { authorizationHeader: { Authorization: 'Bearer token' } }
});

/**
 * Helper: creates a dispatch spy that records plain-object actions
 * and executes thunks (like postLogout) inline.
 */
const makeDispatchSpy = () => {
  const dispatched = [];
  const dispatch = action => {
    if (typeof action === 'function') return action(dispatch);
    dispatched.push(action);
    return action;
  };
  return { dispatch, dispatched };
};

/**
 * Property 1: Action creator extracts cavers field
 *
 * For any array of caver-like objects returned by the API in the
 * `cavers` response field, the fetchInvalidEmailCavers thunk
 * dispatches a success action whose `cavers` payload is exactly
 * that array.
 *
 * Encodes: the thunk correctly extracts the `cavers` field
 * from the API response and passes it through unchanged.
 * Covers: random arrays of caver-like objects of varying size
 * and shape.
 *
 * Validates: Requirements 2.3
 */
describe('Feature: invalid-email-cavers, Property 1: Action creator extracts cavers field', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches success with the exact cavers array from the API response', async () => {
    await fc.assert(
      fc.asyncProperty(caversArrayArb, async cavers => {
        fetch.mockResolvedValue({
          status: 200,
          json: () => Promise.resolve({ cavers })
        });

        const { dispatch, dispatched } = makeDispatchSpy();
        await fetchInvalidEmailCavers()(dispatch, getState);

        expect(dispatched.length).toBe(2);
        expect(dispatched[0]).toEqual({
          type: 'FETCH_INVALID_EMAIL_CAVERS'
        });
        expect(dispatched[1]).toEqual({
          type: 'FETCH_INVALID_EMAIL_CAVERS_SUCCESS',
          cavers
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Missing cavers field falls back to empty array
 *
 * When the API returns a 200 response whose body does NOT contain
 * a `cavers` field, the thunk dispatches success with an empty array.
 *
 * Encodes: the defensive `data.cavers || []` fallback in the thunk.
 * Covers: response bodies with arbitrary keys but no `cavers` field.
 *
 * Validates: Requirements 2.4
 */
describe('Feature: invalid-email-cavers, Property 2: Missing cavers field falls back to empty array', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const responseWithoutCaversArb = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 10 }).filter(k => k !== 'cavers'),
    fc.jsonValue()
  );

  it('dispatches success with an empty array when cavers field is missing', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

    await fc.assert(
      fc.asyncProperty(responseWithoutCaversArb, async body => {
        fetch.mockResolvedValue({
          status: 200,
          json: () => Promise.resolve(body)
        });

        const { dispatch, dispatched } = makeDispatchSpy();
        await fetchInvalidEmailCavers()(dispatch, getState);

        expect(dispatched.length).toBe(2);
        expect(dispatched[0]).toEqual({
          type: 'FETCH_INVALID_EMAIL_CAVERS'
        });
        expect(dispatched[1]).toEqual({
          type: 'FETCH_INVALID_EMAIL_CAVERS_SUCCESS',
          cavers: []
        });
      }),
      { numRuns: 100 }
    );

    consoleSpy.mockRestore();
  });
});

/**
 * Property 3: Non-auth errors dispatch failure action
 *
 * When the fetch rejects with an error that does NOT have
 * `isAuthError = true`, the thunk dispatches the failure action
 * with that error.
 *
 * Encodes: the catch block dispatches FETCH_INVALID_EMAIL_CAVERS_FAILURE
 * for non-auth errors.
 * Covers: random error messages.
 *
 * Validates: Requirements 2.5
 */
describe('Feature: invalid-email-cavers, Property 3: Non-auth errors dispatch failure action', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const errorMessageArb = fc.string({ minLength: 1, maxLength: 50 });

  it('dispatches failure with the error for non-auth errors', async () => {
    await fc.assert(
      fc.asyncProperty(errorMessageArb, async msg => {
        const error = new Error(msg);
        fetch.mockRejectedValue(error);

        const { dispatch, dispatched } = makeDispatchSpy();
        await fetchInvalidEmailCavers()(dispatch, getState);

        expect(dispatched.length).toBe(2);
        expect(dispatched[0]).toEqual({
          type: 'FETCH_INVALID_EMAIL_CAVERS'
        });
        expect(dispatched[1]).toEqual({
          type: 'FETCH_INVALID_EMAIL_CAVERS_FAILURE',
          error
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Auth errors skip failure dispatch
 *
 * When checkAuthStatus intercepts a 401 response, it throws an
 * error with `isAuthError = true`. The thunk's catch block must
 * skip the failure dispatch in that case, leaving only the
 * loading action and the LOGOUT action (from postLogout).
 *
 * Encodes: the `if (error.isAuthError) return;` guard in the
 * catch block.
 * Covers: 401 responses (single partition, not property-varied).
 */
describe('Feature: invalid-email-cavers, Property 4: Auth errors skip failure dispatch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not dispatch failure when the API returns 401', async () => {
    fetch.mockResolvedValue({ status: 401 });

    const { dispatch, dispatched } = makeDispatchSpy();
    await fetchInvalidEmailCavers()(dispatch, getState);

    // Should see FETCH_INVALID_EMAIL_CAVERS and LOGOUT, but NOT FAILURE
    expect(dispatched.map(a => a.type)).toContain('FETCH_INVALID_EMAIL_CAVERS');
    expect(dispatched.map(a => a.type)).toContain('LOGOUT');
    expect(dispatched.map(a => a.type)).not.toContain(
      'FETCH_INVALID_EMAIL_CAVERS_FAILURE'
    );
  });
});
