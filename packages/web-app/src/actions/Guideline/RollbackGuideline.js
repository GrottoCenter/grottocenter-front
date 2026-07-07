import fetch from 'isomorphic-fetch';
import { rollbackGuidelineUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const ROLLBACK_GUIDELINE = 'ROLLBACK_GUIDELINE';
export const ROLLBACK_GUIDELINE_SUCCESS = 'ROLLBACK_GUIDELINE_SUCCESS';
export const ROLLBACK_GUIDELINE_FAILURE = 'ROLLBACK_GUIDELINE_FAILURE';

export const rollbackGuidelineAction = () => ({
  type: ROLLBACK_GUIDELINE
});

export const rollbackGuidelineSuccess = guideline => ({
  type: ROLLBACK_GUIDELINE_SUCCESS,
  guideline
});

export const rollbackGuidelineFailure = error => ({
  type: ROLLBACK_GUIDELINE_FAILURE,
  error
});

export const rollbackGuideline =
  ({ id, snapshotId }) =>
  (dispatch, getState) => {
    dispatch(rollbackGuidelineAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(rollbackGuidelineUrl(id, snapshotId), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(rollbackGuidelineSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return null;
        dispatch(
          rollbackGuidelineFailure(
            makeErrorMessage(error.message, `Rolling back guideline`),
            error.message
          )
        );
        return null;
      });
  };
