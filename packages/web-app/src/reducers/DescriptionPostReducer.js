import {
  POST_DESCRIPTION,
  POST_DESCRIPTION_FAILURE,
  POST_DESCRIPTION_SUCCESS
} from '../actions/Description';

const initialState = {
  loading: false,
  error: null,
  data: null,
  description: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_DESCRIPTION:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case POST_DESCRIPTION_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case POST_DESCRIPTION_SUCCESS:
      return {
        ...state,
        data: action.cave,
        error: initialState.error,
        loading: false,
        description: action.massif
      };
    default:
      return state;
  }
};

export default reducer;
