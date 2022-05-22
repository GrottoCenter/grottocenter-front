import {
  MOVE_ENTRANCE_TO_CAVE,
  MOVE_ENTRANCE_TO_CAVE_FAILURE,
  MOVE_ENTRANCE_TO_CAVE_SUCCESS
} from '../actions/MoveEntranceToCave';

const initialState = {
  loading: false,
  error: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case MOVE_ENTRANCE_TO_CAVE:
      return {
        ...state,
        error: initialState.error,
        loading: true
      };
    case MOVE_ENTRANCE_TO_CAVE_FAILURE:
      return {
        ...state,
        error: action.error,
        loading: false
      };
    case MOVE_ENTRANCE_TO_CAVE_SUCCESS:
      return {
        ...state,
        error: null,
        loading: false
      };
    default:
      return state;
  }
};

export default reducer;
