import fetch from 'isomorphic-fetch';
import { postPersonGroupsUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const POST_PERSON_GROUPS = 'POST_PERSON_GROUPS';
export const POST_PERSON_GROUPS_SUCCESS = 'POST_PERSON_GROUPS_SUCCESS';
export const POST_PERSON_GROUPS_FAILURE = 'POST_PERSON_GROUPS_FAILURE';

const postPersonGroupsAction = () => ({ type: POST_PERSON_GROUPS });
const postPersonGroupsActionSuccess = () => ({
  type: POST_PERSON_GROUPS_SUCCESS
});
const postPersonGroupsActionFailure = error => ({
  type: POST_PERSON_GROUPS_FAILURE,
  error
});

export function postPersonGroups(caverId, groups) {
  return (dispatch, getState) => {
    dispatch(postPersonGroupsAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ groups }),
      headers: getState().login.authorizationHeader
    };

    return fetch(postPersonGroupsUrl(caverId), requestOptions)
      .then(checkAndGetStatus)
      .then(() => dispatch(postPersonGroupsActionSuccess()))
      .catch(error => dispatch(postPersonGroupsActionFailure(error)));
  };
}
