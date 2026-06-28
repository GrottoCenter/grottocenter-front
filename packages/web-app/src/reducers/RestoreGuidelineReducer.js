import {
  RESTORE_GUIDELINE,
  RESTORE_GUIDELINE_SUCCESS,
  RESTORE_GUIDELINE_FAILURE
} from '../actions/Guideline/RestoreGuideline';

const initialState = {
  error: null,
  isLoading: false,
  guideline: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case RESTORE_GUIDELINE:
      return {
        ...initialState,
        isLoading: true
      };
    case RESTORE_GUIDELINE_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        guideline: action.guideline
      };
    case RESTORE_GUIDELINE_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
