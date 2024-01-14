import fetch from 'isomorphic-fetch';
import { getDocumentChildrenUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';
import { checkAndGetStatus } from './utils';

export const FETCH_DOCUMENT_CHILDREN = 'FETCH_DOCUMENT_CHILDREN';
export const FETCH_DOCUMENT_CHILDREN_SUCCESS =
  'FETCH_DOCUMENT_CHILDREN_SUCCESS';
export const FETCH_DOCUMENT_CHILDREN_FAILURE =
  'FETCH_DOCUMENT_CHILDREN_FAILURE';

export const fetchDocumentChildren =
  (documentId, locale = 'en') =>
  dispatch => {
    dispatch({ type: FETCH_DOCUMENT_CHILDREN });
    return fetch(getDocumentChildrenUrl(documentId))
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        data.documents.sort((a, b) =>
          a.title
            .toLowerCase()
            .localeCompare(b.title.toLowerCase(), locale, { numeric: true })
        );
        dispatch({
          type: FETCH_DOCUMENT_CHILDREN_SUCCESS,
          data: data.documents
        });
      })
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
