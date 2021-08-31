import {
  FETCH_FORMATS_ERROR,
  FETCH_FORMATS_LOAD,
  FETCH_FORMATS_SUCCESS
} from '../actions/FileFormats';

const initialState = {
  data: null,
  loading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_FORMATS_LOAD:
      return {
        ...initialState,
        loading: true
      };
    case FETCH_FORMATS_SUCCESS:
      return {
        ...initialState,
        data: action.payload
      };
    case FETCH_FORMATS_ERROR:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
