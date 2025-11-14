import fetch from 'isomorphic-fetch';
import { leaveOrganizationUrl } from '../../conf/apiRoutes';

export const leaveOrganization = (caverId, organizationId) => (
  dispatch,
  getState
) => {
  const requestOptions = {
    method: 'DELETE',
    headers: getState().login.authorizationHeader
  };

  return fetch(leaveOrganizationUrl(caverId, organizationId), requestOptions)
    .then(response => {
      if (response.status === 404) {
        throw new Error('Caver is not a member of this organization');
      }
      if (response.status >= 400) {
        throw new Error(`Bad response from server: ${response.status}`);
      }
      return response.status === 204 ? null : response.json();
    })
    .then(() => {
      dispatch({ type: 'LEAVE_ORGANIZATION_SUCCESS', organizationId });
    })
    .catch(error => {
      dispatch({ type: 'LEAVE_ORGANIZATION_FAILURE', error });
      throw error;
    });
};
