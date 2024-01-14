import fetch from 'isomorphic-fetch';
import { getDocumentTypesUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';
import { checkAndGetStatus } from './utils';

export const FETCH_DOCUMENT_TYPES = 'FETCH_DOCUMENT_TYPES';
export const FETCH_DOCUMENT_TYPES_SUCCESS = 'FETCH_DOCUMENT_TYPES_SUCCESS';
export const FETCH_DOCUMENT_TYPES_FAILURE = 'FETCH_DOCUMENT_TYPES_FAILURE';

const FIRST_DOCUMENT_TYPES_TO_DISPLAY = ['Article', 'Collection', 'Issue'];

export const fetchDocumentTypes = () => ({
  type: FETCH_DOCUMENT_TYPES
});

export const fetchDocumentTypesSuccess = documentTypes => ({
  type: FETCH_DOCUMENT_TYPES_SUCCESS,
  documentTypes
});

export const fetchDocumentTypesFailure = error => ({
  type: FETCH_DOCUMENT_TYPES_FAILURE,
  error
});

export function loadDocumentTypes() {
  // console.trace('loadDocumentTypes');
  return dispatch => {
    dispatch(fetchDocumentTypes());

    return fetch(`${getDocumentTypesUrl}?isAvailable=true`)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        const { documentTypes } = data;
        const firstDocumentTypes = documentTypes
          .filter(dt => FIRST_DOCUMENT_TYPES_TO_DISPLAY.includes(dt.name))
          .sort((dt1, dt2) => dt1.name > dt2.name);
        const otherDocumentTypes = documentTypes
          .filter(dt => !FIRST_DOCUMENT_TYPES_TO_DISPLAY.includes(dt.name))
          .sort((dt1, dt2) => dt1.name > dt2.name);
        dispatch(
          fetchDocumentTypesSuccess([
            ...firstDocumentTypes,
            ...otherDocumentTypes
          ])
        );
      })
      .catch(error =>
        dispatch(
          fetchDocumentTypesFailure(
            makeErrorMessage(error.message, `Fetching document types`)
          )
        )
      );
  };
}
