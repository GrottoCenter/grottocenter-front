import fetch from 'isomorphic-fetch';
import { getSubscriptionsUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';

export const FETCH_SUBSCRIPTIONS = 'FETCH_SUBSCRIPTIONS';
export const FETCH_SUBSCRIPTIONS_SUCCESS = 'FETCH_SUBSCRIPTIONS_SUCCESS';
export const FETCH_SUBSCRIPTIONS_FAILURE = 'FETCH_SUBSCRIPTIONS_FAILURE';

const fetchSubscriptionsAction = () => ({
  type: FETCH_SUBSCRIPTIONS
});

const fetchSubscriptionsActionSuccess = subscriptions => ({
  type: FETCH_SUBSCRIPTIONS_SUCCESS,
  subscriptions
});

const fetchSubscriptionsActionFailure = error => ({
  type: FETCH_SUBSCRIPTIONS_FAILURE,
  error
});

export function fetchSubscriptions(caverId) {
  return (dispatch, getState) => {
    dispatch(fetchSubscriptionsAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getSubscriptionsUrl(caverId), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        dispatch(fetchSubscriptionsActionSuccess(data.subscriptions));
      })
      .catch(error =>
        dispatch(
          fetchSubscriptionsActionFailure(
            makeErrorMessage(
              error.message,
              `Fetching subscriptions of caver with id ${caverId}`
            ),
            error.message
          )
        )
      );
  };
}
