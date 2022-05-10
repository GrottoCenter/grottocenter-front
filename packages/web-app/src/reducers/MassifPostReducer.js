import {
  POST_MASSIF,
  POST_MASSIF_FAILURE,
  POST_MASSIF_SUCCESS
} from '../actions/Massif';

const initialState = {
  loading: false,
  error: null,
  data: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_MASSIF:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case POST_MASSIF_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case POST_MASSIF_SUCCESS:
      return {
        ...state,
        data: action.cave,
        error: initialState.error,
        loading: false
      };
    default:
      return state;
  }
};

export default reducer;
