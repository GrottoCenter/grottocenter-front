import {
  GET_MODERATORS,
  GET_MODERATORS_FAILURE,
  GET_MODERATORS_SUCCESS
} from '../actions/Person/GetPerson';

const initialState = {
  errorMessages: [],
  isLoading: false,
  latestHttpCode: undefined,
  moderators: []
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_MODERATORS:
      return {
        ...state,
        isLoading: true,
        errorMessages: [],
        latestHttpCode: undefined
      };
    case GET_MODERATORS_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessages: [action.errorMessage]
      };

    case GET_MODERATORS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        errorMessages: [],
        moderators: action.moderators
      };
    default:
      return state;
  }
};

export default reducer;
