import {
  FETCH_USER,
  FETCH_USER_FAILURE,
  FETCH_USER_SUCCESS
} from '../actions/User';

const initialState = {
  user: undefined, // user fetched
  isFetching: false, // show loading spinner
  error: null // fetch errors
};

const user = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_USER:
      return { ...state, user: action.user, isFetching: true };
    case FETCH_USER_SUCCESS:
      return { ...state, user: action.user, isFetching: false };
    case FETCH_USER_FAILURE:
      return { ...state, isFetching: false, error: action.error };
    default:
      return state;
  }
};

export default user;
