import fetch from 'isomorphic-fetch';
import { getStatisticsRegionUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';

export const FETCH_STATISTICS_REGION = 'FETCH_STATISTICS_REGION';
export const FETCH_STATISTICS_REGION_SUCCESS =
  'FETCH_STATISTICS_REGION_SUCCESS';
export const FETCH_STATISTICS_REGION_FAILURE =
  'FETCH_STATISTICS_REGION_FAILURE';

export const fetchStatisticsRegionAction = () => ({
  type: FETCH_STATISTICS_REGION
});

export const fetchStatisticsRegionActionSuccess = statistics => ({
  type: FETCH_STATISTICS_REGION_SUCCESS,
  statistics
});

export const fetchStatisticsRegionActionFailure = error => ({
  type: FETCH_STATISTICS_REGION_FAILURE,
  error
});

export function fetchStatisticsRegion(countryId, regionId) {
  return dispatch => {
    dispatch(fetchStatisticsRegionAction());

    const requestOptions = {
      method: 'GET'
    };

    return fetch(getStatisticsRegionUrl(countryId, regionId), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        dispatch(fetchStatisticsRegionActionSuccess(data));
      })
      .catch(error =>
        dispatch(
          fetchStatisticsRegionActionFailure(
            makeErrorMessage(
              error.message,
              `Fetching statistics for region ${regionId} in country ${countryId}`
            )
          )
        )
      );
  };
}
