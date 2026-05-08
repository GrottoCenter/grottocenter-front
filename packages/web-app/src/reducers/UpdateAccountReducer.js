import {
  UPDATE_ACCOUNT,
  UPDATE_ACCOUNT_FAILURE,
  UPDATE_ACCOUNT_SUCCESS
} from '../actions/Account/UpdateAccount';

const initialState = {
  error: undefined,
  isLoading: false,
  isSuccess: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_ACCOUNT:
      return {
        ...initialState,
        isLoading: true
      };
    case UPDATE_ACCOUNT_SUCCESS:
      return {
        ...initialState,
        isSuccess: true
      };
    case UPDATE_ACCOUNT_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
