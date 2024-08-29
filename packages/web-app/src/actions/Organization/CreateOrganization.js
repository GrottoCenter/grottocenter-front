import fetch from 'isomorphic-fetch';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { postOrganizationUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const POST_ORGANIZATION = 'POST_ORGANIZATION';
export const POST_ORGANIZATION_SUCCESS = 'POST_ORGANIZATION_SUCCESS';
export const POST_ORGANIZATION_FAILURE = 'POST_ORGANIZATION_FAILURE';

const postOrganizationAction = () => ({
  type: POST_ORGANIZATION
});
const postOrganizationSuccess = organization => ({
  type: POST_ORGANIZATION_SUCCESS,
  organization
});
const postOrganizationFailure = error => ({
  type: POST_ORGANIZATION_FAILURE,
  error
});

export const postOrganization = body => (dispatch, getState) => {
  dispatch(postOrganizationAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: getState().login.authorizationHeader
  };

  return fetch(postOrganizationUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => {
      dispatch(postOrganizationSuccess(data));
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
