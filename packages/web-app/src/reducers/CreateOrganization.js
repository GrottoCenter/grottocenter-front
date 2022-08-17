import {
  POST_ORGANIZATION,
  POST_ORGANIZATION_FAILURE,
  POST_ORGANIZATION_SUCCESS
} from '../actions/Organization/CreateOrganization';

const initialState = {
  error: null,
  isLoading: false,
  organization: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case POST_ORGANIZATION:
      return {
        ...initialState,
        isLoading: true
      };
    case POST_ORGANIZATION_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    case POST_ORGANIZATION_SUCCESS:
      return {
        ...initialState,
        organization: action.organization
      };
    default:
      return state;
  }
};

export default reducer;
