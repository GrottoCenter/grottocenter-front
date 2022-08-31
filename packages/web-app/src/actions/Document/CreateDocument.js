import fetch from 'isomorphic-fetch';

import { postDocumentUrl } from '../../conf/Config';
import { buildFormData } from './utils';

// ==========
export const POST_DOCUMENT = 'POST_DOCUMENT';
export const POST_DOCUMENT_SUCCESS = 'POST_DOCUMENT_SUCCESS';
export const POST_DOCUMENT_FAILURE = 'POST_DOCUMENT_FAILURE';

// ==========

export const postDocumentAction = () => ({
  type: POST_DOCUMENT
});

export const postDocumentSuccess = httpCode => ({
  type: POST_DOCUMENT_SUCCESS,
  httpCode
});

export const postDocumentFailure = (errorMessages, httpCode) => ({
  type: POST_DOCUMENT_FAILURE,
  errorMessages,
  httpCode
});

export function postDocument(docAttributes) {
  return (dispatch, getState) => {
    dispatch(postDocumentAction());

    // Merge startPage and endPage in one attribute 'pages'
    const { startPage, endPage } = docAttributes;
    let pages = null;

    // A page can be 0 so check for 'if(startPage)' only will not work.
    // That's why we use 'if(startPage === null)' here.
    if (startPage === null && endPage !== null) {
      pages = endPage;
    } else if (startPage !== null && endPage === null) {
      pages = `${startPage},`;
    } else if (startPage !== null && endPage !== null) {
      pages = `${startPage}-${endPage}`;
    }

    const attributes = { ...docAttributes, pages };
    delete attributes.files;
    const formData = new FormData();

    buildFormData(formData, attributes);

    // Files must have the same key name for each file, as it is asked by the parser on server side.
    const { files } = docAttributes;
    files.forEach(file => {
      formData.append('files', file.file, `${file.name}.${file.extension}`);
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
