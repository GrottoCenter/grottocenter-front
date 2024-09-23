import {
  FETCH_GROUPS,
  FETCH_GROUPS_FAILURE,
  FETCH_GROUPS_SUCCESS
} from '../actions/Person/GetPerson';

const initialState = {
  administrators: [],
  moderators: [],
  leaders: [],
  isLoading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_GROUPS:
      return {
        ...initialState,
        isLoading: true
      };
    case FETCH_GROUPS_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        ...action.groups
      };
    case FETCH_GROUPS_FAILURE:
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
