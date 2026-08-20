import {
  FETCH_BANNED_CAVERS,
  FETCH_BANNED_CAVERS_FAILURE,
  FETCH_BANNED_CAVERS_SUCCESS
} from '../actions/Person/adminLists';

const initialState = {
  bannedCavers: [],
  isLoading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_BANNED_CAVERS:
      return {
        ...initialState,
        isLoading: true
      };
    case FETCH_BANNED_CAVERS_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        bannedCavers: action.cavers
      };
    case FETCH_BANNED_CAVERS_FAILURE:
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
