import fetch from 'isomorphic-fetch';
import { getDocumentChildrenUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const FETCH_DOCUMENT_CHILDREN = 'FETCH_DOCUMENT_CHILDREN';
export const FETCH_DOCUMENT_CHILDREN_SUCCESS =
  'FETCH_DOCUMENT_CHILDREN_SUCCESS';
export const FETCH_DOCUMENT_CHILDREN_FAILURE =
  'FETCH_DOCUMENT_CHILDREN_FAILURE';

// The payload is stored exactly as the API returned it. Ordering is a display
// concern and belongs to the view, which lets the reader pick an order per
// section — sorting here as well meant two owners for one decision, and froze
// the collation to whatever locale happened to be active at fetch time.
export const fetchDocumentChildren = documentId => dispatch => {
  dispatch({ type: FETCH_DOCUMENT_CHILDREN });
  return fetch(getDocumentChildrenUrl(documentId))
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => {
      dispatch({
        type: FETCH_DOCUMENT_CHILDREN_SUCCESS,
        data: data.documents
      });
    })
    .catch(error => dispatch({ type: FETCH_DOCUMENT_CHILDREN_FAILURE, error }));
};
