import fetch from 'isomorphic-fetch';
import { getMassifEntrancesUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const FETCH_MASSIF_ENTRANCES_DATA_QUALITY_SUCCESS =
  'FETCH_MASSIF_ENTRANCES_DATA_QUALITY_SUCCESS';
export const FETCH_MASSIF_ENTRANCES_DATA_QUALITY_LOADING =
  'FETCH_MASSIF_ENTRANCES_DATA_QUALITY_LOADING';
export const FETCH_MASSIF_ENTRANCES_DATA_QUALITY_ERROR =
  'FETCH_MASSIF_ENTRANCES_DATA_QUALITY_ERROR';

export const fetchMassifEntrances = massifId => (dispatch, getState) => {
  dispatch({ type: FETCH_MASSIF_ENTRANCES_DATA_QUALITY_LOADING });
  const requestOptions = {
    headers: getState().login.authorizationHeader
  };
  return fetch(getMassifEntrancesUrl(massifId), requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => {
      dispatch({ type: FETCH_MASSIF_ENTRANCES_DATA_QUALITY_SUCCESS, data });
    })
    .catch(error =>
      dispatch({
        type: FETCH_MASSIF_ENTRANCES_DATA_QUALITY_ERROR,
        error
      })
    );
};
