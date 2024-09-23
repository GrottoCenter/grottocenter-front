import {
  FETCH_CHANGE_EMAIL,
  FETCH_CHANGE_EMAIL_FAILURE,
  FETCH_CHANGE_EMAIL_SUCCESS
} from '../actions/Person/ChangeEmail';

const initialState = {
  error: null,
  isFetching: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_CHANGE_EMAIL:
      return {
        ...state,
        isFetching: true,
        error: null
      };
    case FETCH_CHANGE_EMAIL_SUCCESS:
      return {
        ...state,
        error: null,
        isFetching: false
      };
    case FETCH_CHANGE_EMAIL_FAILURE:
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
