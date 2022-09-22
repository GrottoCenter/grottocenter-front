import fetch from 'isomorphic-fetch';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { postOrganizationUrl } from '../../conf/apiRoutes';

export const POST_ORGANIZATION = 'POST_ORGANIZATION';
export const POST_ORGANIZATION_SUCCESS = 'POST_ORGANIZATION_SUCCESS';
export const POST_ORGANIZATION_FAILURE = 'POST_ORGANIZATION_FAILURE';

export const postOrganizationAction = () => ({
  type: POST_ORGANIZATION
});

export const postOrganizationSuccess = organization => ({
  type: POST_ORGANIZATION_SUCCESS,
  organization
});

export const postOrganizationFailure = error => ({
  type: POST_ORGANIZATION_FAILURE,
  error
});

export const postOrganization = data => (dispatch, getState) => {
  dispatch(postOrganizationAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(postOrganizationUrl, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(res => {
      dispatch(postOrganizationSuccess(res));
    })
    .catch(error =>
      dispatch(
        postOrganizationFailure(
          makeErrorMessage(error.message, `Bad request`),
          error.message
        )
      )
    );
};
