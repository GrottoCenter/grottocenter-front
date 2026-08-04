import fetch from 'isomorphic-fetch';
import {
  getConversationsUrl,
  getArchivedConversationsUrl
} from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus, getTotalCount, makeUrl } from '../utils';

export const FETCH_CONVERSATIONS = 'FETCH_CONVERSATIONS';
export const FETCH_CONVERSATIONS_SUCCESS = 'FETCH_CONVERSATIONS_SUCCESS';
export const FETCH_CONVERSATIONS_FAILURE = 'FETCH_CONVERSATIONS_FAILURE';

const fetchConversationsAction = isArchived => ({
  type: FETCH_CONVERSATIONS,
  isArchived
});

const fetchConversationsActionSuccess = (
  conversations,
  totalCount,
  isArchived
) => ({
  type: FETCH_CONVERSATIONS_SUCCESS,
  conversations,
  totalCount,
  isArchived
});

const fetchConversationsActionFailure = (error, isArchived) => ({
  type: FETCH_CONVERSATIONS_FAILURE,
  error,
  isArchived
});

/**
 * Fetch conversations for the authenticated user.
 * @param {Object} criterias - Pagination criteria (limit, offset)
 * @param {boolean} isArchived - Whether to fetch archived conversations
 */
export function fetchConversations(criterias, isArchived = false) {
  return async (dispatch, getState) => {
    dispatch(fetchConversationsAction(isArchived));

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    const url = isArchived ? getArchivedConversationsUrl : getConversationsUrl;

    try {
      const response = await checkAuthStatus(dispatch)(
        await fetch(makeUrl(url, criterias), requestOptions)
      );

      const data = await response.json();
      const contentRangeHeader = response.headers.get('Content-Range');

      return dispatch(
        fetchConversationsActionSuccess(
          data.conversations,
          getTotalCount(data.conversations.length, contentRangeHeader),
          isArchived
        )
      );
    } catch (error) {
      if (error.isAuthError) return;
      return dispatch(
        fetchConversationsActionFailure(
          error.body ||
            makeErrorMessage(error.message, `Fetching user conversations`),
          isArchived
        )
      );
    }
  };
}
