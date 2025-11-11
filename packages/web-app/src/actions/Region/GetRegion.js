import fetch from 'isomorphic-fetch';
import { getRegionUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';

export const FETCH_REGION = 'FETCH_REGION';
export const FETCH_REGION_SUCCESS = 'FETCH_REGION_SUCCESS';
export const FETCH_REGION_FAILURE = 'FETCH_REGION_FAILURE';

export const fetchRegionAction = () => ({
  type: FETCH_REGION
});

export const fetchRegionActionSuccess = region => ({
  type: FETCH_REGION_SUCCESS,
  region
});

export const fetchRegionActionFailure = error => ({
  type: FETCH_REGION_FAILURE,
  error
});

export function fetchRegion(countryId, regionId) {
  return dispatch => {
    dispatch(fetchRegionAction());

    const requestOptions = {
      method: 'GET'
    };

    return fetch(getRegionUrl(countryId, regionId), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        dispatch(fetchRegionActionSuccess(data));
      })
      .catch(error =>
        dispatch(
          fetchRegionActionFailure(
            makeErrorMessage(
              error.message,
              `Fetching region with id ${regionId} in country ${countryId}`
            ),
            error.message
          )
        )
      );
  };
}
