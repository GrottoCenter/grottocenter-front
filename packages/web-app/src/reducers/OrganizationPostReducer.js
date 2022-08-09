import {
  POST_ORGANIZATION,
  POST_ORGANIZATION_FAILURE,
  POST_ORGANIZATION_SUCCESS
} from '../actions/Organization/CreateOrganization';

const initialState = {
  loading: false,
  error: null,
  data: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_ORGANIZATION:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case POST_ORGANIZATION_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case POST_ORGANIZATION_SUCCESS:
      return {
        ...state,
        data: action.organization,
        error: initialState.error,
        loading: false
      };
    default:
      return state;
  }
};

export default reducer;
