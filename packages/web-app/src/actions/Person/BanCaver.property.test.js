import fc from 'fast-check';
import { postBanCaver, postUnbanCaver } from './BanCaver';

// Mock isomorphic-fetch
jest.mock('isomorphic-fetch');

// Mock the Login module
jest.mock('../Login', () => ({
  postLogout: () => mockPostLogoutThunk
}));

const mockPostLogoutThunk = dispatch => {
  dispatch({ type: 'LOGOUT' });
};

/**
 * Property 7: Ban/Unban action creator dispatch sequence
 *
 * For any caverId, dispatching postBanCaver(caverId) or postUnbanCaver(caverId)
 * first dispatches a loading action, then on API success dispatches a success
 * action, or on API failure dispatches a failure action with the error.
 *
 * Encodes: Redux async action pattern — loading → success or loading → failure.
 * Covers: random caverId values with mocked success and failure responses.
 *
 * Validates: Requirements 4.2, 4.3
 */
describe('Property 7: Ban/Unban action creator dispatch sequence', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const caverIdArb = fc.oneof(
    fc.integer({ min: 1, max: 999999 }),
    fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/)
  );

  const getState = () => ({
    login: { authorizationHeader: { Authorization: 'Bearer token' } }
  });

  it('postBanCaver dispatches loading then success on 200', async () => {
    await fc.assert(
      fc.asyncProperty(caverIdArb, async caverId => {
        const fetch = require('isomorphic-fetch');
        fetch.mockResolvedValue({ status: 200 });

        const dispatched = [];
        const dispatch = action => {
          if (typeof action === 'function') return action(dispatch);
          dispatched.push(action);
          return action;
        };

        await postBanCaver(caverId)(dispatch, getState);

        expect(dispatched.length).toBe(2);
        expect(dispatched[0]).toEqual({ type: 'POST_BAN_CAVER' });
        expect(dispatched[1]).toEqual({ type: 'POST_BAN_CAVER_SUCCESS' });
      }),
      { numRuns: 100 }
    );
  });

  it('postBanCaver dispatches loading then failure on non-401 error', async () => {
    await fc.assert(
      fc.asyncProperty(caverIdArb, async caverId => {
        const fetch = require('isomorphic-fetch');
        fetch.mockResolvedValue({
          status: 403,
          json: () => Promise.resolve({ message: 'Forbidden' })
        });

        const dispatched = [];
        const dispatch = action => {
          if (typeof action === 'function') return action(dispatch);
          dispatched.push(action);
          return action;
        };

        await postBanCaver(caverId)(dispatch, getState);

        expect(dispatched.length).toBe(2);
        expect(dispatched[0]).toEqual({ type: 'POST_BAN_CAVER' });
        expect(dispatched[1].type).toBe('POST_BAN_CAVER_FAILURE');
        expect(dispatched[1].error).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('postBanCaver skips failure dispatch on 401 auth error', async () => {
    await fc.assert(
      fc.asyncProperty(caverIdArb, async caverId => {
        const fetch = require('isomorphic-fetch');
        fetch.mockResolvedValue({ status: 401 });

        const dispatched = [];
        const dispatch = action => {
          if (typeof action === 'function') return action(dispatch);
          dispatched.push(action);
          return action;
        };

        await postBanCaver(caverId)(dispatch, getState);

        // loading + logout (from checkAuthStatus), but NOT failure
        expect(dispatched[0]).toEqual({ type: 'POST_BAN_CAVER' });
        expect(dispatched.some(a => a.type === 'LOGOUT')).toBe(true);
        expect(dispatched.some(a => a.type === 'POST_BAN_CAVER_FAILURE')).toBe(
          false
        );
      }),
      { numRuns: 100 }
    );
  });

  it('postUnbanCaver dispatches loading then success on 200', async () => {
    await fc.assert(
      fc.asyncProperty(caverIdArb, async caverId => {
        const fetch = require('isomorphic-fetch');
        fetch.mockResolvedValue({ status: 200 });

        const dispatched = [];
        const dispatch = action => {
          if (typeof action === 'function') return action(dispatch);
          dispatched.push(action);
          return action;
        };

        await postUnbanCaver(caverId)(dispatch, getState);

        expect(dispatched.length).toBe(2);
        expect(dispatched[0]).toEqual({ type: 'POST_UNBAN_CAVER' });
        expect(dispatched[1]).toEqual({ type: 'POST_UNBAN_CAVER_SUCCESS' });
      }),
      { numRuns: 100 }
    );
  });

  it('postUnbanCaver dispatches loading then failure on non-401 error', async () => {
    await fc.assert(
      fc.asyncProperty(caverIdArb, async caverId => {
        const fetch = require('isomorphic-fetch');
        fetch.mockResolvedValue({
          status: 404,
          json: () => Promise.resolve({ message: 'Not Found' })
        });

        const dispatched = [];
        const dispatch = action => {
          if (typeof action === 'function') return action(dispatch);
          dispatched.push(action);
          return action;
        };

        await postUnbanCaver(caverId)(dispatch, getState);

        expect(dispatched.length).toBe(2);
        expect(dispatched[0]).toEqual({ type: 'POST_UNBAN_CAVER' });
        expect(dispatched[1].type).toBe('POST_UNBAN_CAVER_FAILURE');
        expect(dispatched[1].error).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('postUnbanCaver skips failure dispatch on 401 auth error', async () => {
    await fc.assert(
      fc.asyncProperty(caverIdArb, async caverId => {
        const fetch = require('isomorphic-fetch');
        fetch.mockResolvedValue({ status: 401 });

        const dispatched = [];
        const dispatch = action => {
          if (typeof action === 'function') return action(dispatch);
          dispatched.push(action);
          return action;
        };

        await postUnbanCaver(caverId)(dispatch, getState);

        expect(dispatched[0]).toEqual({ type: 'POST_UNBAN_CAVER' });
        expect(dispatched.some(a => a.type === 'LOGOUT')).toBe(true);
        expect(
          dispatched.some(a => a.type === 'POST_UNBAN_CAVER_FAILURE')
        ).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
