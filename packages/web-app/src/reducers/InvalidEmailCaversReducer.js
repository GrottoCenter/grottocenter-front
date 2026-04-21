import {
  FETCH_INVALID_EMAIL_CAVERS,
  FETCH_INVALID_EMAIL_CAVERS_FAILURE,
  FETCH_INVALID_EMAIL_CAVERS_SUCCESS
} from '../actions/Person/GetPerson';

const initialState = {
  invalidEmailCavers: [],
  isLoading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_INVALID_EMAIL_CAVERS:
      return {
        ...initialState,
        isLoading: true
      };
    case FETCH_INVALID_EMAIL_CAVERS_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        invalidEmailCavers: action.cavers
      };
    case FETCH_INVALID_EMAIL_CAVERS_FAILURE:
      return {
        ...initialState,
        isLoading: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
