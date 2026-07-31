import fetch from 'isomorphic-fetch';
import { getDocumentChildrenUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';
import {
  DEFAULT_CHILDREN_SORT_ORDER,
  sortDocumentChildren
} from '../../utils/documentChildrenSort';

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
        dispatch({
          type: FETCH_DOCUMENT_CHILDREN_SUCCESS,
          data: sortDocumentChildren(
            data.documents,
            DEFAULT_CHILDREN_SORT_ORDER,
            locale
          )
        });
      })
      .catch(error =>
        dispatch({ type: FETCH_DOCUMENT_CHILDREN_FAILURE, error })
      );
  };
