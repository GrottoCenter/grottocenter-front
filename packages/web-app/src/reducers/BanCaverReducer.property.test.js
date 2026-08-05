import fc from 'fast-check';
import reducer from './BanCaverReducer';
import {
  POST_BAN_CAVER,
  POST_BAN_CAVER_SUCCESS,
  POST_BAN_CAVER_FAILURE,
  POST_UNBAN_CAVER,
  POST_UNBAN_CAVER_SUCCESS,
  POST_UNBAN_CAVER_FAILURE
} from '../actions/Person/BanCaver';

/**
 * Property 8: Ban reducer state transitions
 *
 * For any sequence of ban/unban action types (loading, success, failure),
 * the banCaver reducer produces the correct state: loading action sets
 * { isLoading: true, isSuccess: false, error: null }, success action sets
 * { isLoading: false, isSuccess: true, error: null }, failure action sets
 * { isLoading: false, isSuccess: false, error: <action.error> }.
 *
 * Encodes: reducer is a pure state machine with deterministic transitions.
 * Covers: all six action types in random sequences.
 *
 * Validates: Requirements 4.4
 */
describe('Property 8: Ban reducer state transitions', () => {
  const loadingTypes = [POST_BAN_CAVER, POST_UNBAN_CAVER];
  const successTypes = [POST_BAN_CAVER_SUCCESS, POST_UNBAN_CAVER_SUCCESS];
  const failureTypes = [POST_BAN_CAVER_FAILURE, POST_UNBAN_CAVER_FAILURE];

  const errorArb = fc.string({ minLength: 1, maxLength: 50 }).map(msg => {
    const err = new Error(msg);
    return err;
  });

  const actionArb = fc.oneof(
    fc.constantFrom(...loadingTypes).map(type => ({ type })),
    fc.constantFrom(...successTypes).map(type => ({ type })),
    fc
      .tuple(fc.constantFrom(...failureTypes), errorArb)
      .map(([type, error]) => ({ type, error }))
  );

  it('produces correct state for any single action type', () => {
    fc.assert(
      fc.property(actionArb, action => {
        const state = reducer(undefined, action);

        if (loadingTypes.includes(action.type)) {
          expect(state).toEqual({
            isLoading: true,
            isSuccess: false,
            error: null
          });
        } else if (successTypes.includes(action.type)) {
          expect(state).toEqual({
            isLoading: false,
            isSuccess: true,
            error: null
          });
        } else if (failureTypes.includes(action.type)) {
          expect(state).toEqual({
            isLoading: false,
            isSuccess: false,
            error: action.error
          });
        }
      }),
      { numRuns: 100 }
    );
  });

  it('produces correct final state for any sequence of actions', () => {
    fc.assert(
      fc.property(
        fc.array(actionArb, { minLength: 1, maxLength: 20 }),
        actions => {
          let state;
          for (const action of actions) {
            state = reducer(state, action);
          }

          const lastAction = actions[actions.length - 1];

          if (loadingTypes.includes(lastAction.type)) {
            expect(state).toEqual({
              isLoading: true,
              isSuccess: false,
              error: null
            });
          } else if (successTypes.includes(lastAction.type)) {
            expect(state).toEqual({
              isLoading: false,
              isSuccess: true,
              error: null
            });
          } else if (failureTypes.includes(lastAction.type)) {
            expect(state).toEqual({
              isLoading: false,
              isSuccess: false,
              error: lastAction.error
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns initial state for unknown action types', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 30 })
          .filter(
            type =>
              ![...loadingTypes, ...successTypes, ...failureTypes].includes(
                type
              )
          ),
        type => {
          const state = reducer(undefined, { type });
          expect(state).toEqual({
            error: null,
            isLoading: false,
            isSuccess: false
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
