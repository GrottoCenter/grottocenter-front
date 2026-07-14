import {
  ROLLBACK_GUIDELINE,
  ROLLBACK_GUIDELINE_FAILURE,
  ROLLBACK_GUIDELINE_SUCCESS
} from '../actions/Guideline/RollbackGuideline';

const initialState = {
  error: null,
  isLoading: false,
  guideline: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case ROLLBACK_GUIDELINE:
      return {
        ...initialState,
        isLoading: true
      };
    case ROLLBACK_GUIDELINE_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        guideline: action.guideline
      };
    case ROLLBACK_GUIDELINE_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
