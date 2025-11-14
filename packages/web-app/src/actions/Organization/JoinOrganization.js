import fetch from 'isomorphic-fetch';
import { joinOrganizationUrl } from '../../conf/apiRoutes';

export const joinOrganization = (caverId, organizationId) => (
  dispatch,
  getState
) => {
  const requestOptions = {
    method: 'PUT',
    headers: getState().login.authorizationHeader
  };

  return fetch(joinOrganizationUrl(caverId, organizationId), requestOptions)
    .then(response => {
      if (response.status === 400) {
        throw new Error('Caver is already a member of this organization');
      }
      if (response.status >= 400) {
        throw new Error(`Bad response from server: ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      dispatch({ type: 'JOIN_ORGANIZATION_SUCCESS', organizationId });
    })
    .catch(error => {
      dispatch({ type: 'JOIN_ORGANIZATION_FAILURE', error });
      throw error;
    });
};
