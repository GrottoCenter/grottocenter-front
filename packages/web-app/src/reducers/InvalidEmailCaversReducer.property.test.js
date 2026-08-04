import fc from 'fast-check';
import reducer from './InvalidEmailCaversReducer';
import {
  FETCH_INVALID_EMAIL_CAVERS,
  FETCH_INVALID_EMAIL_CAVERS_SUCCESS,
  FETCH_INVALID_EMAIL_CAVERS_FAILURE
} from '../actions/Person/GetPerson';

/**
 * Property 2: Reducer state transitions
 *
 * For any prior reducer state and any dispatched action (loading,
 * success with a random cavers array, or failure with a random error),
 * the InvalidEmailCaversReducer produces the correct output state:
 * - loading sets { invalidEmailCavers: [], isLoading: true, error: null }
 * - success sets { invalidEmailCavers: <payload>, isLoading: false, error: null }
 * - failure sets { invalidEmailCavers: [], isLoading: false, error: <payload> }
 *
 * Encodes: reducer is a pure state machine with deterministic transitions
 * that always reset to initialState spread, regardless of prior state.
 * Covers: random prior states and all three action types.
 *
 * Validates: Requirements 2.7, 2.8, 2.9
 */
describe('Feature: invalid-email-cavers, Property 2: Reducer state transitions', () => {
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

  const errorArb = fc
    .string({ minLength: 1, maxLength: 50 })
    .map(msg => new Error(msg));

  const priorStateArb = fc.record({
    invalidEmailCavers: caversArrayArb,
    isLoading: fc.boolean(),
    error: fc.option(errorArb, { nil: null })
  });

  const actionArb = fc.oneof(
    fc.constant({ type: FETCH_INVALID_EMAIL_CAVERS }),
    caversArrayArb.map(cavers => ({
      type: FETCH_INVALID_EMAIL_CAVERS_SUCCESS,
      cavers
    })),
    errorArb.map(error => ({
      type: FETCH_INVALID_EMAIL_CAVERS_FAILURE,
      error
    }))
  );

  it('produces correct state for any prior state and action', () => {
    fc.assert(
      fc.property(priorStateArb, actionArb, (priorState, action) => {
        const state = reducer(priorState, action);

        if (action.type === FETCH_INVALID_EMAIL_CAVERS) {
          expect(state).toEqual({
            invalidEmailCavers: [],
            isLoading: true,
            error: null
          });
        } else if (action.type === FETCH_INVALID_EMAIL_CAVERS_SUCCESS) {
          expect(state).toEqual({
            invalidEmailCavers: action.cavers,
            isLoading: false,
            error: null
          });
        } else if (action.type === FETCH_INVALID_EMAIL_CAVERS_FAILURE) {
          expect(state).toEqual({
            invalidEmailCavers: [],
            isLoading: false,
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

          if (lastAction.type === FETCH_INVALID_EMAIL_CAVERS) {
            expect(state).toEqual({
              invalidEmailCavers: [],
              isLoading: true,
              error: null
            });
          } else if (lastAction.type === FETCH_INVALID_EMAIL_CAVERS_SUCCESS) {
            expect(state).toEqual({
              invalidEmailCavers: lastAction.cavers,
              isLoading: false,
              error: null
            });
          } else if (lastAction.type === FETCH_INVALID_EMAIL_CAVERS_FAILURE) {
            expect(state).toEqual({
              invalidEmailCavers: [],
              isLoading: false,
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
              ![
                FETCH_INVALID_EMAIL_CAVERS,
                FETCH_INVALID_EMAIL_CAVERS_SUCCESS,
                FETCH_INVALID_EMAIL_CAVERS_FAILURE
              ].includes(type)
          ),
        type => {
          const state = reducer(undefined, { type });
          expect(state).toEqual({
            invalidEmailCavers: [],
            isLoading: false,
            error: null
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
