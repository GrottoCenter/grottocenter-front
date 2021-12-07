import {
  FETCH_CHANGE_PASSWORD,
  FETCH_CHANGE_PASSWORD_FAILURE,
  FETCH_CHANGE_PASSWORD_SUCCESS
} from '../actions/ChangePassword';

const initialState = {
  error: null,
  isFetching: false
};

const changePassword = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_CHANGE_PASSWORD:
      return {
        ...state,
        isFetching: true,
        error: null
      };
    case FETCH_CHANGE_PASSWORD_SUCCESS:
      return {
        ...state,
        error: null,
        isFetching: false
      };
    case FETCH_CHANGE_PASSWORD_FAILURE:
      return {
        ...state,
        isFetching: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default changePassword;
