import {
  FETCH_IDENTIFIER_TYPES,
  FETCH_IDENTIFIER_TYPES_FAILURE,
  FETCH_IDENTIFIER_TYPES_SUCCESS
} from '../actions/IdentifierType';

const initialState = {
  identifierTypes: [],
  isFetching: false,
  error: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_IDENTIFIER_TYPES:
      return { ...state, isFetching: true };

    case FETCH_IDENTIFIER_TYPES_SUCCESS:
      return {
        ...state,
        identifierTypes: action.identifierTypes,
        isFetching: false
      };

    case FETCH_IDENTIFIER_TYPES_FAILURE:
      return { ...state, error: action.error, isFetching: false };

    default:
      return state;
  }
};

export default reducer;
