import {
  FETCH_MASSIF_ENTRANCES_DATA_QUALITY_SUCCESS,
  FETCH_MASSIF_ENTRANCES_DATA_QUALITY_LOADING,
  FETCH_MASSIF_ENTRANCES_DATA_QUALITY_ERROR
} from '../actions/Massif/GetEntrancesDataQuality';

const initialState = {
  massifEntrances: {},
  massifEntrancesLoading: false,
  massifEntrancesError: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MASSIF_ENTRANCES_DATA_QUALITY_LOADING:
      return {
        ...state,
        massifEntrancesError: null,
        massifEntrancesLoading: true
      };
    case FETCH_MASSIF_ENTRANCES_DATA_QUALITY_SUCCESS:
      return {
        ...initialState,
        massifEntrances: action.data.quality
      };
    case FETCH_MASSIF_ENTRANCES_DATA_QUALITY_ERROR:
      return {
        ...state,
        massifEntrancesLoading: false,
        massifEntrancesError: action.error
      };
    default:
      return state;
  }
};

export default reducer;
