import fetch from 'isomorphic-fetch';
import { getStatisticsMassifUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const FETCH_STATISTICS_MASSIF_SUCCESS =
  'FETCH_STATISTICS_MASSIF_SUCCESS';
export const FETCH_STATISTICS_MASSIF_LOADING =
  'FETCH_STATISTICS_MASSIF_LOADING';
export const FETCH_STATISTICS_MASSIF_ERROR = 'FETCH_STATISTICS_MASSIF_ERROR';

export const fetchStatisticsMassif = massifId => (dispatch, getState) => {
  dispatch({ type: FETCH_STATISTICS_MASSIF_LOADING });
  const requestOptions = {
    headers: getState().login.authorizationHeader
  };
  return fetch(getStatisticsMassifUrl(massifId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => {
      dispatch({ type: FETCH_STATISTICS_MASSIF_SUCCESS, data });
    })
    .catch(error => {
      if (error.isAuthError) return;
      dispatch({
        type: FETCH_STATISTICS_MASSIF_ERROR,
        error
      });
    });
};
