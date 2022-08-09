import {
  UPDATE_LOCATION,
  UPDATE_LOCATION_FAILURE,
  UPDATE_LOCATION_SUCCESS
} from '../actions/Location/UpdateLocation';

const initialState = {
  error: null,
  isLoading: false,
  location: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_LOCATION:
      return {
        ...initialState,
        isLoading: true
      };
    case UPDATE_LOCATION_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        location: action.location
      };
    case UPDATE_LOCATION_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
