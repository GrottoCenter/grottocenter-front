import {
  POST_PERSON_GROUPS,
  POST_PERSON_GROUPS_FAILURE,
  POST_PERSON_GROUPS_SUCCESS
} from '../actions/Person/UpdatePersonGroups';

const initialState = {
  errorMessages: [],
  isLoading: false,
  latestHttpCode: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_PERSON_GROUPS:
      return {
        ...state,
        isLoading: true,
        errorMessages: [],
        latestHttpCode: undefined
      };
    case POST_PERSON_GROUPS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        errorMessages: [],
        latestHttpCode: action.httpCode
      };
    case POST_PERSON_GROUPS_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessages: action.errorMessages,
        latestHttpCode: action.httpCode
      };
    default:
      return state;
  }
};

export default reducer;
