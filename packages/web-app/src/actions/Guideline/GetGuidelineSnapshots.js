import fetch from 'isomorphic-fetch';
import { getSnapshotsUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const GET_GUIDELINE_SNAPSHOTS = 'GET_GUIDELINE_SNAPSHOTS';
export const GET_GUIDELINE_SNAPSHOTS_SUCCESS = 'GET_GUIDELINE_SNAPSHOTS_SUCCESS';
export const GET_GUIDELINE_SNAPSHOTS_FAILURE = 'GET_GUIDELINE_SNAPSHOTS_FAILURE';

export const getGuidelineSnapshotsAction = () => ({
  type: GET_GUIDELINE_SNAPSHOTS
});

export const getGuidelineSnapshotsSuccess = data => ({
  type: GET_GUIDELINE_SNAPSHOTS_SUCCESS,
  data
});

export const getGuidelineSnapshotsFailure = error => ({
  type: GET_GUIDELINE_SNAPSHOTS_FAILURE,
  error
});

export const fetchGuidelineSnapshots =
  (id) =>
  (dispatch, getState) => {
    dispatch(getGuidelineSnapshotsAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getSnapshotsUrl(id, 'guidelines'), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(getGuidelineSnapshotsSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          getGuidelineSnapshotsFailure(
            makeErrorMessage(error.message, `Fetching guideline history`),
            error.message
          )
        );
      });
  };
