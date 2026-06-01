import {
  POST_GUIDELINE,
  POST_GUIDELINE_SUCCESS,
  POST_GUIDELINE_FAILURE
} from '../actions/Guideline/CreateGuideline';

const initialState = {
  error: null,
  isLoading: false,
  guideline: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_GUIDELINE:
      return {
        ...initialState,
        isLoading: true
      };
    case POST_GUIDELINE_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        guideline: action.guideline
      };
    case POST_GUIDELINE_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
