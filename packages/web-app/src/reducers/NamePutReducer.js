import {
  UPDATE_NAME,
  UPDATE_NAME_FAILURE,
  UPDATE_NAME_SUCCESS
} from '../actions/Name';

const initialState = {
  loading: false,
  error: null,
  data: null,
  name: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_NAME:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case UPDATE_NAME_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case UPDATE_NAME_SUCCESS:
      return {
        ...state,
        data: action.cave,
        error: initialState.error,
        loading: false,
        name: action.name
      };
    default:
      return state;
  }
};

export default reducer;
