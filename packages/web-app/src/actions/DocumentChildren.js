import fetch from 'isomorphic-fetch';
import { getDocumentChildrenUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_DOCUMENT_CHILDREN = 'FETCH_DOCUMENT_CHILDREN';
export const FETCH_DOCUMENT_CHILDREN_SUCCESS =
  'FETCH_DOCUMENT_CHILDREN_SUCCESS';
export const FETCH_DOCUMENT_CHILDREN_FAILURE =
  'FETCH_DOCUMENT_CHILDREN_FAILURE';

export const fetchDocumentChildren = documentId => dispatch => {
  dispatch({ type: FETCH_DOCUMENT_CHILDREN });
  return fetch(getDocumentChildrenUrl(documentId))
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data =>
      dispatch({ type: FETCH_DOCUMENT_CHILDREN_SUCCESS, data: data.documents })
    )
    .catch(error =>
      dispatch({
        type: FETCH_DOCUMENT_CHILDREN_FAILURE,
        error: makeErrorMessage(
          error.message,
          `Fetching children of document with id ${documentId}`
        )
      })
    );
};
