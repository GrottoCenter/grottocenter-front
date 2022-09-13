import {
  FETCH_SUBSCRIPTIONS,
  FETCH_SUBSCRIPTIONS_FAILURE,
  FETCH_SUBSCRIPTIONS_SUCCESS
} from '../actions/Subscriptions/GetSubscriptions';
import { UNSUBSCRIBE_FROM_COUNTRY_SUCCESS } from '../actions/Subscriptions/UnsubscribeFromCountry';
import { UNSUBSCRIBE_FROM_MASSIF_SUCCESS } from '../actions/Subscriptions/UnsubscribeFromMassif';
import REDUCER_STATUS from './ReducerStatus';

const initialState = {
  error: undefined,
  status: REDUCER_STATUS.IDLE,
  subscriptions: undefined
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_SUBSCRIPTIONS:
      return {
        ...state,
        error: undefined,
        status: REDUCER_STATUS.LOADING
      };
    case FETCH_SUBSCRIPTIONS_SUCCESS:
      return {
        ...state,
        status: REDUCER_STATUS.SUCCEEDED,
        subscriptions: action.subscriptions
      };
    case FETCH_SUBSCRIPTIONS_FAILURE:
      return {
        ...state,
        error: action.error,
        status: REDUCER_STATUS.FAILED
      };
    case UNSUBSCRIBE_FROM_COUNTRY_SUCCESS:
      return {
        ...state,
        subscriptions: state.subscriptions
          ? {
              ...state.subscriptions,
              countries: state.subscriptions.countries.filter(
                s => s.id !== action.countryId
              )
            }
          : undefined
      };
    case UNSUBSCRIBE_FROM_MASSIF_SUCCESS:
      return {
        ...state,
        subscriptions: state.subscriptions
          ? {
              ...state.subscriptions,
              massifs: state.subscriptions.massifs.filter(
                s => s.id !== action.massifId
              )
            }
          : undefined
      };
    default:
      return state;
  }
};

export default reducer;
