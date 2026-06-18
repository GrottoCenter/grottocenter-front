import fetch from 'isomorphic-fetch';
import { substancesUrl, substancesSearchUrl } from '../conf/apiRoutes';
import { checkAuthStatus } from './utils';

/**
 * Search substances via the unified endpoint.
 * Returns the results array directly (local component state, not Redux).
 * @param {string} searchTerm - Minimum 2 characters
 * @returns {Promise<Array<{id, name, formula, casNumber, externalId, externalSource}>>}
 */
export const searchSubstances = searchTerm => (_dispatch, getState) => {
  const { authorizationHeader } = getState().login;

  const requestOptions = {
    method: 'GET',
    headers: authorizationHeader
  };

  return fetch(substancesSearchUrl(searchTerm), requestOptions)
    .then(checkAuthStatus(_dispatch))
    .then(response => response.json())
    .catch(error => {
      if (error.isAuthError) return [];
      // Graceful degradation — return empty results on failure
      // eslint-disable-next-line no-console
      console.error('Substance search failed:', error.message);
      return [];
    });
};

/**
 * Create (or find existing) substance.
 * @param {{name, formula?, casNumber?, externalId?, externalSource?}} data
 * @returns {Promise<{id, name, formula, casNumber, externalId, externalSource}>}
 */
export const createSubstance = data => (_dispatch, getState) => {
  const { authorizationHeader } = getState().login;

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      ...authorizationHeader,
      'Content-Type': 'application/json'
    }
  };

  return fetch(substancesUrl, requestOptions)
    .then(checkAuthStatus(_dispatch))
    .then(response => response.json())
    .catch(error => {
      if (error.isAuthError) return undefined;
      // eslint-disable-next-line no-console
      console.error('Substance creation failed:', error.message);
      throw error;
    });
};
