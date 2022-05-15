import {
  UPDATE_DESCRIPTION,
  UPDATE_DESCRIPTION_FAILURE,
  UPDATE_DESCRIPTION_SUCCESS
} from '../actions/Description';

const initialState = {
  loading: false,
  error: null,
  data: null,
  description: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_DESCRIPTION:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case UPDATE_DESCRIPTION_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case UPDATE_DESCRIPTION_SUCCESS:
      return {
        ...state,
        data: action.cave,
        error: initialState.error,
        loading: false,
        description: action.description
      };
    default:
      return state;
  }
};

export default reducer;
