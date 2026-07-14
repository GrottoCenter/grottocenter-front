import {
  DELETE_GUIDELINE,
  DELETE_GUIDELINE_SUCCESS,
  DELETE_GUIDELINE_FAILURE
} from '../actions/Guideline/DeleteGuideline';

const initialState = {
  error: null,
  isLoading: false,
  guideline: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case DELETE_GUIDELINE:
      return {
        ...initialState,
        isLoading: true
      };
    case DELETE_GUIDELINE_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        guideline: action.guideline
      };
    case DELETE_GUIDELINE_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
