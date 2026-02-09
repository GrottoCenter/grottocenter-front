import {
  FETCH_PROJECTIONS_FAILURE,
  FETCH_PROJECTIONS_SUCCESS,
  FETCH_PROJECTIONS_LOADING
} from '../actions/Projections';
import { registerProjections } from '../helpers/coordinateTransform';

const defaultState = {
  projections: null,
  loading: false,
  error: null
};

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case FETCH_PROJECTIONS_LOADING:
      return {
        ...state,
        error: defaultState.error,
        loading: true
      };
    case FETCH_PROJECTIONS_SUCCESS:
      registerProjections(action.data);
      return {
        ...state,
        loadings: false,
        projections: action.data
      };
    case FETCH_PROJECTIONS_FAILURE:
      return {
        ...state,
        loadings: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
