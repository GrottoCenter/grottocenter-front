import {
  POST_PERSON_GROUPS,
  POST_PERSON_GROUPS_FAILURE,
  POST_PERSON_GROUPS_SUCCESS
} from '../actions/Person/UpdatePersonGroups';

const initialState = {
  error: null,
  isLoading: false,
  isSuccess: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_PERSON_GROUPS:
      return {
        isLoading: true,
        isSuccess: false,
        error: null
      };
    case POST_PERSON_GROUPS_SUCCESS:
      return {
        isLoading: false,
        isSuccess: true,
        error: null
      };
    case POST_PERSON_GROUPS_FAILURE:
      return {
        isLoading: false,
        isSuccess: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
