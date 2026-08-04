import fetch from 'isomorphic-fetch';
import { previewMassifSensitiveUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

/**
 * Fetch the preview count of affected entrances when marking a massif as sensitive.
 * @param {number} id - Massif ID
 * @returns {Promise<number>} - Affected entrances count
 */
export const previewSensitiveMassif = id => (dispatch, getState) => {
  const requestOptions = {
    method: 'GET',
    headers: getState().login.authorizationHeader
  };

  return fetch(previewMassifSensitiveUrl(id), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => data.count)
    .catch(error => {
      if (error.isAuthError) return;
      throw error;
    });
};
