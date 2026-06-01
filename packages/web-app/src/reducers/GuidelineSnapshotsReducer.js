import {
  GET_GUIDELINE_SNAPSHOTS,
  GET_GUIDELINE_SNAPSHOTS_SUCCESS,
  GET_GUIDELINE_SNAPSHOTS_FAILURE
} from '../actions/Guideline/GetGuidelineSnapshots';

const initialState = {
  error: null,
  isLoading: false,
  data: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_GUIDELINE_SNAPSHOTS:
      return {
        ...initialState,
        isLoading: true
      };
    case GET_GUIDELINE_SNAPSHOTS_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        data: action.data
      };
    case GET_GUIDELINE_SNAPSHOTS_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
