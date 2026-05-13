import fetch from 'isomorphic-fetch';

import { postDocumentUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';
import { buildFormData } from './utils';

export const POST_DOCUMENT = 'POST_DOCUMENT';
export const POST_DOCUMENT_SUCCESS = 'POST_DOCUMENT_SUCCESS';
export const POST_DOCUMENT_FAILURE = 'POST_DOCUMENT_FAILURE';

const postDocumentAction = () => ({
  type: POST_DOCUMENT
});

const postDocumentSuccess = (document, httpCode) => ({
  type: POST_DOCUMENT_SUCCESS,
  document,
  httpCode
});

const postDocumentFailure = (errorMessages, httpCode) => ({
  type: POST_DOCUMENT_FAILURE,
  errorMessages,
  httpCode
});

export function postDocument(docAttributes) {
  return (dispatch, getState) => {
    dispatch(postDocumentAction());
    const { files, selectOptionAuthorizationDocument, ...rest } = docAttributes;
    const attributes = { ...rest, option: selectOptionAuthorizationDocument };

    const formData = new FormData();
    buildFormData(formData, attributes);

    // Files must have the same key name for each file, as it is asked by the parser on server side.
    files.forEach(file => {
      formData.append('files', file.file, file.fileName);
    });

    const requestOptions = {
      method: 'POST',
      body: formData,
      headers: {
        ...getState().login.authorizationHeader
      }
    };

    return fetch(postDocumentUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response =>
        response.text().then(responseText => {
          if (response.status >= 400) {
            const errorMessages = [];
            switch (response.status) {
              case 400:
                errorMessages.push(`Bad request: ${responseText}`);
                break;
              case 403:
                errorMessages.push(
                  'You are not authorized to create a document.'
                );
                break;
              case 404:
                errorMessages.push(
                  'Server-side creation of the document is not available.'
                );
                break;
              case 500:
                errorMessages.push(
                  'A server error occurred, please try again later or contact Wikicaves for more information.'
                );
                break;
              default:
                break;
            }
            dispatch(postDocumentFailure(errorMessages, response.status));
            throw new Error(
              `Fetching ${postDocumentUrl} status: ${response.status}`
            );
          }
          let createdDocument;
          try {
            createdDocument = JSON.parse(responseText)?.document;
          } catch (_) {
            // response body not parseable, continue without document object
          }
          dispatch(postDocumentSuccess(createdDocument, response.status));
          return createdDocument;
        })
      )
      .catch(err => {
        if (err.isAuthError) return;
      });
  };
}
