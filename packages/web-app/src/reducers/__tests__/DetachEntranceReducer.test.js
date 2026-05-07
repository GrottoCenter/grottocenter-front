import reducer from '../DetachEntranceReducer';
import {
  DETACH_ENTRANCE,
  DETACH_ENTRANCE_SUCCESS,
  DETACH_ENTRANCE_FAILURE,
  DETACH_ENTRANCE_RESET
} from '../../actions/Entrance/DetachEntrance';

describe('DetachEntranceReducer', () => {
  const initialState = {
    loading: false,
    error: undefined,
    success: false
  };

  it('should return the initial state when called with undefined state', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  it('should handle DETACH_ENTRANCE', () => {
    const state = reducer(initialState, { type: DETACH_ENTRANCE });
    expect(state).toEqual({
      loading: true,
      error: undefined,
      success: false
    });
  });

  it('should handle DETACH_ENTRANCE_SUCCESS', () => {
    const loadingState = { loading: true, error: undefined, success: false };
    const state = reducer(loadingState, { type: DETACH_ENTRANCE_SUCCESS });
    expect(state).toEqual({
      loading: false,
      error: undefined,
      success: true
    });
  });

  it('should handle DETACH_ENTRANCE_FAILURE', () => {
    const loadingState = { loading: true, error: undefined, success: false };
    const errorMessage = 'Something went wrong';
    const state = reducer(loadingState, {
      type: DETACH_ENTRANCE_FAILURE,
      error: errorMessage
    });
    expect(state).toEqual({
      loading: false,
      error: errorMessage,
      success: false
    });
  });

  it('should return current state for unknown actions', () => {
    const currentState = { loading: true, error: 'test', success: false };
    const state = reducer(currentState, { type: 'UNKNOWN_ACTION' });
    expect(state).toBe(currentState);
  });

  it('should handle DETACH_ENTRANCE_RESET', () => {
    const dirtyState = { loading: false, error: 'some error', success: true };
    const state = reducer(dirtyState, { type: DETACH_ENTRANCE_RESET });
    expect(state).toEqual(initialState);
  });
});
