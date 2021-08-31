import {
  FETCH_LICENSES_ERROR,
  FETCH_LICENSES_LOAD,
  FETCH_LICENSES_SUCCESS
} from '../actions/Licenses';

const initialState = {
  data: null,
  loading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_LICENSES_LOAD:
      return {
        ...initialState,
        loading: true
      };
    case FETCH_LICENSES_SUCCESS:
      return {
        ...initialState,
        data: action.payload
      };
    case FETCH_LICENSES_ERROR:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
