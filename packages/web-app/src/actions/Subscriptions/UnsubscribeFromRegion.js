import fetch from 'isomorphic-fetch';
import { unsubscribeFromRegionUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const UNSUBSCRIBE_FROM_REGION = 'UNSUBSCRIBE_FROM_REGION';
export const UNSUBSCRIBE_FROM_REGION_SUCCESS =
  'UNSUBSCRIBE_FROM_REGION_SUCCESS';
export const UNSUBSCRIBE_FROM_REGION_FAILURE =
  'UNSUBSCRIBE_FROM_REGION_FAILURE';

export const unsubscribeFromRegionAction = () => ({
  type: UNSUBSCRIBE_FROM_REGION
});

export const unsubscribeFromRegionActionSuccess = regionId => ({
  type: UNSUBSCRIBE_FROM_REGION_SUCCESS,
  regionId
});

export const unsubscribeFromRegionActionFailure = error => ({
  type: UNSUBSCRIBE_FROM_REGION_FAILURE,
  error
});

export function unsubscribeFromRegion(countryId, regionId, userId = null) {
  return (dispatch, getState) => {
    dispatch(unsubscribeFromRegionAction());

    const url = userId
      ? `${unsubscribeFromRegionUrl(countryId, regionId)}?userId=${userId}`
      : unsubscribeFromRegionUrl(countryId, regionId);

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(url, requestOptions).then(response => {
      if (response.status >= 400) {
        const error = `Unsubscribing you from region with id ${regionId} in country ${countryId}`;
        dispatch(
          unsubscribeFromRegionActionFailure(
            makeErrorMessage(response.status, error)
          )
        );
      } else {
        dispatch(unsubscribeFromRegionActionSuccess(`${countryId}-${regionId}`));
      }
      return response;
    });
  };
}
