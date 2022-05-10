import {
  UPDATE_MASSIF,
  UPDATE_MASSIF_FAILURE,
  UPDATE_MASSIF_SUCCESS
} from '../actions/Massif';

const initialState = {
  loading: false,
  error: null,
  data: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_MASSIF:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case UPDATE_MASSIF_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case UPDATE_MASSIF_SUCCESS:
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
