import {
  POST_DESCRIPTION,
  POST_DESCRIPTION_FAILURE,
  POST_DESCRIPTION_SUCCESS
} from '../actions/CreateDescription';

const initialState = {
  error: null,
  isLoading: false,
  description: null
};

const createDescription = (state = initialState, action) => {
  switch (action.type) {
    case POST_DESCRIPTION:
      return {
        ...initialState,
        isLoading: true
      };
    case POST_DESCRIPTION_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        description: action.description
      };
    case POST_DESCRIPTION_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default createDescription;
