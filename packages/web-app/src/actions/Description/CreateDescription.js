import fetch from 'isomorphic-fetch';
import { postDescriptionUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';

export const POST_DESCRIPTION = 'POST_DESCRIPTION';
export const POST_DESCRIPTION_SUCCESS = 'POST_DESCRIPTION_SUCCESS';
export const POST_DESCRIPTION_FAILURE = 'POST_DESCRIPTION_FAILURE';

export const postDescriptionAction = () => ({
  type: POST_DESCRIPTION
});

export const postDescriptionSuccess = description => ({
  type: POST_DESCRIPTION_SUCCESS,
  description
});

export const postDescriptionFailure = error => ({
  type: POST_DESCRIPTION_FAILURE,
  error
});

export const postDescription = data => (dispatch, getState) => {
  dispatch(postDescriptionAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(postDescriptionUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(jsonData => dispatch(postDescriptionSuccess(jsonData)))
    .catch(error =>
      dispatch(
        postDescriptionFailure(
          makeErrorMessage(error.message, `Creating a new description`),
          error.message
        )
      )
    );
};
