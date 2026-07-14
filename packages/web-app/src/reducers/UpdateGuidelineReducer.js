import {
  PATCH_GUIDELINE,
  PATCH_GUIDELINE_SUCCESS,
  PATCH_GUIDELINE_FAILURE
} from '../actions/Guideline/UpdateGuideline';

const initialState = {
  error: null,
  isLoading: false,
  guideline: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case PATCH_GUIDELINE:
      return {
        ...initialState,
        isLoading: true
      };
    case PATCH_GUIDELINE_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        guideline: action.guideline
      };
    case PATCH_GUIDELINE_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
