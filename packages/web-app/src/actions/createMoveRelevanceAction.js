import fetch from 'isomorphic-fetch';
import makeErrorMessage from '../helpers/makeErrorMessage';
import { checkAuthStatus } from './utils';

/**
 * Factory for move-relevance Redux actions.
 * Eliminates duplication across entity types — each entity file
 * becomes a two-liner.
 *
 * @param {string} entityName - Upper-case entity name (e.g. 'LOCATION')
 * @param {Function} urlBuilder - URL builder from apiRoutes (e.g. moveLocationRelevanceUrl)
 * @param {string} label - Human-readable label for error messages (e.g. 'location')
 */
const createMoveRelevanceAction = (entityName, urlBuilder, label) => {
  const MOVE = `MOVE_${entityName}_RELEVANCE`;
  const SUCCESS = `${MOVE}_SUCCESS`;
  const FAILURE = `${MOVE}_FAILURE`;

  const thunk = (id, direction) => (dispatch, getState) => {
    dispatch({ type: MOVE });

    const requestOptions = {
      method: 'PATCH',
      body: JSON.stringify({ direction }),
      headers: getState().login.authorizationHeader
    };

    return fetch(urlBuilder(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data =>
        dispatch({ type: SUCCESS, moved: data.moved, swapped: data.swapped })
      )
      .catch(error => {
        if (error.isAuthError) return { error: true };
        dispatch({
          type: FAILURE,
          error: makeErrorMessage(error.message, `Moving ${label} relevance`)
        });
        return { error: error.message };
      });
  };

  return { MOVE, SUCCESS, FAILURE, thunk };
};

export default createMoveRelevanceAction;
