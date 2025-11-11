import fetch from 'isomorphic-fetch';
import { subscribeToRegionUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const SUBSCRIBE_TO_REGION = 'SUBSCRIBE_TO_REGION';
export const SUBSCRIBE_TO_REGION_SUCCESS = 'SUBSCRIBE_TO_REGION_SUCCESS';
export const SUBSCRIBE_TO_REGION_FAILURE = 'SUBSCRIBE_TO_REGION_FAILURE';

export const subscribeToRegionAction = () => ({
  type: SUBSCRIBE_TO_REGION
});

export const subscribeToRegionActionSuccess = () => ({
  type: SUBSCRIBE_TO_REGION_SUCCESS
});

export const subscribeToRegionActionFailure = error => ({
  type: SUBSCRIBE_TO_REGION_FAILURE,
  error
});

export function subscribeToRegion(countryId, regionId) {
  return (dispatch, getState) => {
    dispatch(subscribeToRegionAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(
      subscribeToRegionUrl(countryId, regionId),
      requestOptions
    ).then(response => {
      if (response.status >= 400) {
        const error = `Subscribing you to region with id ${regionId} in country ${countryId}`;
        dispatch(
          subscribeToRegionActionFailure(
            makeErrorMessage(response.status, error)
          )
        );
      } else {
        dispatch(subscribeToRegionActionSuccess());
      }
      return response;
    });
  };
}
