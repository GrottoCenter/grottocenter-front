import {
  UPDATE_ORGANIZATION,
  UPDATE_ORGANIZATION_FAILURE,
  UPDATE_ORGANIZATION_SUCCESS
} from '../actions/Organization/UpdateOrganization';

const initialState = {
  data: null,
  error: null,
  isLoading: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_ORGANIZATION:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case UPDATE_ORGANIZATION_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case UPDATE_ORGANIZATION_SUCCESS:
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
