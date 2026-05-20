import {
  DETACH_ENTRANCE,
  DETACH_ENTRANCE_SUCCESS,
  DETACH_ENTRANCE_FAILURE,
  DETACH_ENTRANCE_RESET
} from '../actions/Entrance/DetachEntrance';

const initialState = {
  loading: false,
  error: undefined,
  success: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case DETACH_ENTRANCE:
      return {
        loading: true,
        error: undefined,
        success: false
      };
    case DETACH_ENTRANCE_SUCCESS:
      return {
        loading: false,
        error: undefined,
        success: true
      };
    case DETACH_ENTRANCE_FAILURE:
      return {
        loading: false,
        error: action.error,
        success: false
      };
    case DETACH_ENTRANCE_RESET:
      return initialState;
    default:
      return state;
  }
};

export default reducer;
