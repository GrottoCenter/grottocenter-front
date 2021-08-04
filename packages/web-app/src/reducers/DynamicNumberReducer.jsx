import {
  INIT_DYNNB_FETCHER,
  FETCH_DYNNB,
  FETCH_DYNNB_SUCCESS,
  FETCH_DYNNB_FAILURE
} from '../actions/DynamicNumber';

const dynamicNumber = (state = { dynamicNumber: [] }, action) => {
  let jDynNb = '';

  switch (action.type) {
    case INIT_DYNNB_FETCHER:
      return {
        ...state,
        [action.numberType]: {
          isFetching: false,
          number: null,
          revoked: true
        }
      };

    case FETCH_DYNNB:
      return {
        ...state,
        [action.numberType]: {
          isFetching: true,
          number: null
        }
      };

    case FETCH_DYNNB_SUCCESS:
      jDynNb = JSON.parse(action.number);

      return {
        ...state,
        [action.numberType]: {
          isFetching: false,
          number: jDynNb.count
        }
      };

    case FETCH_DYNNB_FAILURE:
      return {
        ...state,
        [action.numberType]: {
          isFetching: false,
          number: null,
          error: action.error
        }
      };

    default:
      return state;
  }
};

export default dynamicNumber;
