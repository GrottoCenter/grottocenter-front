import fetch from 'isomorphic-fetch';
import { getStatisticsMassifUrl } from '../../conf/apiRoutes';

export const FETCH_STATISTICS_MASSIF_SUCCESS =
  'FETCH_STATISTICS_MASSIF_SUCCESS';
export const FETCH_STATISTICS_MASSIF_LOADING =
  'FETCH_STATISTICS_MASSIF_LOADING';
export const FETCH_STATISTICS_MASSIF_ERROR = 'FETCH_STATISTICS_MASSIF_ERROR';

export const fetchStatisticsMassif = massifId => (dispatch, getState) => {
  dispatch({ type: FETCH_STATISTICS_MASSIF_LOADING });
  const requestOptions = {
    headers: {
      ...getState().login.authorizationHeader
    }
  };
  return fetch(getStatisticsMassifUrl(massifId), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data => {
      dispatch({ type: FETCH_STATISTICS_MASSIF_SUCCESS, data });
    })
    .catch(error =>
      dispatch({
        type: FETCH_STATISTICS_MASSIF_ERROR,
        error
      })
    );
};
