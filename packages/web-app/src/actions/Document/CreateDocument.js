import fetch from 'isomorphic-fetch';

import { postDocumentUrl } from '../../conf/apiRoutes';
import { buildFormData } from './utils';

export const POST_DOCUMENT = 'POST_DOCUMENT';
export const POST_DOCUMENT_SUCCESS = 'POST_DOCUMENT_SUCCESS';
export const POST_DOCUMENT_FAILURE = 'POST_DOCUMENT_FAILURE';

const postDocumentAction = () => ({
  type: POST_DOCUMENT
});

const postDocumentSuccess = httpCode => ({
  type: POST_DOCUMENT_SUCCESS,
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
    const attributes = { ...docAttributes };
    const { files } = attributes;
    delete attributes.files;

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

    return fetch(postDocumentUrl, requestOptions).then(response =>
      response.text().then(responseText => {
        if (response.status >= 400) {
          const errorMessages = [];
          switch (response.status) {
            case 400:
              errorMessages.push(`Bad request: ${responseText}`);
              break;
            case 401:
              errorMessages.push(
                'You must be authenticated to post a document.'
              );
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
            `Fetching ${postDocumentUrl} status: ${response.status}`,
            errorMessages
          );
        } else {
          dispatch(postDocumentSuccess(response.status));
        }
        return response;
      })
    );
  };
}
