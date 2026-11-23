import { isNil } from 'ramda';
import { CLEAN_ERROR } from '../actions/Error';

const initialState = {
  error: null
};

const reducer = (state = initialState, { error, type }) => {
  // MapRateLimitNotifier owns the shared warning; tile/bulk failures must not
  // also enqueue one legacy toast per rejected request.
  if (type.startsWith('FETCH_MAP_') && Number(error?.type) === 429)
    return state;
  if (!isNil(error)) {
    return {
      error
    };
  }
  if (type === CLEAN_ERROR) {
    return initialState;
  }
  return state;
};

export default reducer;
