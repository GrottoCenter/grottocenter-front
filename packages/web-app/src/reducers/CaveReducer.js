import {
  FETCH_CAVE_SUCCESS,
  FETCH_CAVE_ERROR,
  FETCH_CAVE_LOADING
} from '../actions/Cave/GetCave';

const initialState = {
  data: {
    cave: {
      id: 1,
      depth: 0,
      development: 0,
      interestRate: 0,
      progressionRate: 0,
      accessRate: 0,
      name: 'Cave Name',
      country: 'Country',
      region: 'Region',
      city: 'City',
      author: 'Author'
    },
    entries: []
  },
  loading: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_CAVE_LOADING:
      return {
        ...state,
        error: null,
        loading: true
      };
    case FETCH_CAVE_SUCCESS:
      return {
        ...initialState,
        data: action.data
      };
    case FETCH_CAVE_ERROR:
      return {
        ...state,
        loading: true,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
