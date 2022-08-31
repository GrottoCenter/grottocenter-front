import {
  FETCH_SIGN_UP,
  FETCH_SIGN_UP_FAILURE,
  FETCH_SIGN_UP_SUCCESS
} from '../actions/SignUp';

const initialState = {
  error: null,
  isFetching: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_SIGN_UP:
      return {
        ...state,
        isFetching: true,
        error: null
      };
    case FETCH_SIGN_UP_SUCCESS:
      return {
        ...state,
        error: null,
        isFetching: false
      };
    case FETCH_SIGN_UP_FAILURE:
      return {
        ...state,
        isFetching: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
