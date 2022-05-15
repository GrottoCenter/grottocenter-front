import {
  POST_ORGANIZATION,
  POST_ORGANIZATION_FAILURE,
  POST_ORGANIZATION_SUCCESS
} from '../actions/CreateOrganization';

const initialState = {
  loading: false,
  error: null,
  data: null,
  organization: null
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
        data: action.cave,
        error: initialState.error,
        loading: false,
        organization: action.organization
      };
    default:
      return state;
  }
};

export default reducer;
