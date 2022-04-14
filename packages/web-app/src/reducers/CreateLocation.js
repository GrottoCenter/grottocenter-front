import {
  POST_LOCATION,
  POST_LOCATION_FAILURE,
  POST_LOCATION_SUCCESS
} from '../actions/CreateLocation';

const initialState = {
  error: null,
  isLoading: false,
  location: null
};

const createLocation = (state = initialState, action) => {
  switch (action.type) {
    case POST_LOCATION:
      return {
        ...initialState,
        isLoading: true
      };
    case POST_LOCATION_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        location: action.location
      };
    case POST_LOCATION_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default createLocation;
