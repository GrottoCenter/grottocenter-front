import {
  FETCH_ACCOUNT,
  FETCH_ACCOUNT_FAILURE,
  FETCH_ACCOUNT_SUCCESS
} from '../actions/Account/GetAccount';

const initialState = {
  account: undefined,
  error: undefined,
  isLoading: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_ACCOUNT:
      return {
        ...initialState,
        isLoading: true
      };
    case FETCH_ACCOUNT_SUCCESS:
      return { ...initialState, account: action.account };
    case FETCH_ACCOUNT_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
