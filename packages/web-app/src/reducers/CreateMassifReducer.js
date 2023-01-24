import {
  POST_MASSIF,
  POST_MASSIF_FAILURE,
  POST_MASSIF_SUCCESS
} from '../actions/Massif/CreateMassif';

const initialState = {
  loading: false,
  error: null,
  data: null,
  massif: null
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
        data: action.massif,
        error: initialState.error,
        loading: false,
        massif: action.massif
      };
    default:
      return state;
  }
};

export default reducer;
