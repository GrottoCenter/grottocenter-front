import fetch from 'isomorphic-fetch';
import { deleteGuidelineUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const DELETE_GUIDELINE = 'DELETE_GUIDELINE';
export const DELETE_GUIDELINE_SUCCESS = 'DELETE_GUIDELINE_SUCCESS';
export const DELETE_GUIDELINE_PERMANENT_SUCCESS =
  'DELETE_GUIDELINE_PERMANENT_SUCCESS';
export const DELETE_GUIDELINE_FAILURE = 'DELETE_GUIDELINE_FAILURE';

export const deleteGuidelineAction = () => ({
  type: DELETE_GUIDELINE
});

export const deleteGuidelineSuccess = (guideline, isPermanent) => ({
  type: isPermanent
    ? DELETE_GUIDELINE_PERMANENT_SUCCESS
    : DELETE_GUIDELINE_SUCCESS,
  guideline
});

export const deleteGuidelineFailure = error => ({
  type: DELETE_GUIDELINE_FAILURE,
  error
});

export const deleteGuideline =
  ({ id, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteGuidelineAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deleteGuidelineUrl(id, isPermanent), requestOptions)
      .then(checkAuthStatus(dispatch))
      // Tolerate an empty body (e.g. 204 No Content): calling response.json()
      // on it would throw and route us into the failure branch even though the
      // deletion succeeded, leaving the view stale.
      .then(response =>
        response.status === 204 ? null : response.json().catch(() => null)
      )
      // Always carry the known id so the reducers can drop/update the guideline
      // even when the response doesn't echo it back.
      .then(data => {
        dispatch(deleteGuidelineSuccess({ ...(data || {}), id }, isPermanent));
        return true;
      })
      // Report success/failure to the caller (truthy = success) so the UI can
      // surface a message instead of silently leaving the view stale when the
      // request fails.
      .catch(error => {
        if (error.isAuthError) return false;
        dispatch(
          deleteGuidelineFailure(
            makeErrorMessage(error.message, `Deleting guideline`),
            error.message
          )
        );
        return false;
      });
  };
