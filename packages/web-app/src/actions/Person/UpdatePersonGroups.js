import fetch from 'isomorphic-fetch';
import { postPersonGroupsUrl } from '../../conf/apiRoutes';

// ==========

export const POST_PERSON_GROUPS = 'POST_PERSON_GROUPS';
export const POST_PERSON_GROUPS_SUCCESS = 'POST_PERSON_GROUPS_SUCCESS';
export const POST_PERSON_GROUPS_FAILURE = 'POST_PERSON_GROUPS_FAILURE';

// ==========

export const postPersonGroupsAction = () => ({
  type: POST_PERSON_GROUPS
});

export const postPersonGroupsActionSuccess = httpCode => ({
  type: POST_PERSON_GROUPS_SUCCESS,
  httpCode
});

export const postPersonGroupsActionFailure = (errorMessages, httpCode) => ({
  type: POST_PERSON_GROUPS_FAILURE,
  errorMessages,
  httpCode
});

// ==========

export function postPersonGroups(caverId, groups) {
  return (dispatch, getState) => {
    dispatch(postPersonGroupsAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({
        groups
      }),
      headers: getState().login.authorizationHeader
    };

    return fetch(postPersonGroupsUrl(caverId), requestOptions).then(response =>
      response.text().then(responseText => {
        if (response.status >= 400) {
          const errorMessages = [];
          switch (response.status) {
            case 400:
              errorMessages.push(`Bad request: ${responseText}`);
              break;
            case 401:
              errorMessages.push(
                'You must be authenticated to change a caver groups.'
              );
              break;
            case 403:
              errorMessages.push(
                'You are not authorized to change a caver groups.'
              );
              break;
            case 404:
              errorMessages.push(
                'Server-side update of a caver groups is not available.'
              );
              break;
            case 500:
              errorMessages.push(
                'A server error occurred, please try again later or contact Wikicaves for more information.'
              );
              break;
            default:
              break;
          }
          dispatch(
            postPersonGroupsActionFailure(errorMessages, response.status)
          );
          throw new Error(
            `Fetching ${postPersonGroupsUrl(caverId)} status: ${
              response.status
            }`,
            errorMessages
          );
        } else {
          dispatch(postPersonGroupsActionSuccess(response.status));
        }
        return response;
      })
    );
  };
}
