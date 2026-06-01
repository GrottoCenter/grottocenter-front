import {
  PUT_GUIDELINE,
  PUT_GUIDELINE_SUCCESS,
  PUT_GUIDELINE_FAILURE
} from '../actions/Guideline/UpdateGuideline';

const initialState = {
  error: null,
  isLoading: false,
  guideline: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case PUT_GUIDELINE:
      return {
        ...initialState,
        isLoading: true
      };
    case PUT_GUIDELINE_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        guideline: action.guideline
      };
    case PUT_GUIDELINE_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
