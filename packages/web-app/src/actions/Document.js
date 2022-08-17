import fetch from 'isomorphic-fetch';
import { keys } from 'ramda';
import {
  IS_DELETED,
  IS_MODIFIED,
  IS_NEW
} from '../components/common/AddFileForm/FileHelpers';
import {
  postDocumentUrl,
  putDocumentUrl,
  putDocumentyWithNewEntitiesUrl
} from '../conf/Config';
import { checkAndGetStatus } from './utils';

// ==========
export const POST_DOCUMENT = 'POST_DOCUMENT';
export const POST_DOCUMENT_SUCCESS = 'POST_DOCUMENT_SUCCESS';
export const POST_DOCUMENT_FAILURE = 'POST_DOCUMENT_FAILURE';

export const UPDATE_DOCUMENT = 'UPDATE_DOCUMENT';
export const UPDATE_DOCUMENT_SUCCESS = 'UPDATE_DOCUMENT_SUCCESS';
export const UPDATE_DOCUMENT_FAILURE = 'UPDATE_DOCUMENT_FAILURE';

export const RESET_API_MESSAGES = 'RESET_API_MESSAGES';

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

export const updateDocumentAction = () => ({
  type: UPDATE_DOCUMENT
});

export const updateDocumentSuccess = httpCode => ({
  type: UPDATE_DOCUMENT_SUCCESS,
  httpCode
});

export const updateDocumentFailure = (errorMessages, httpCode) => ({
  type: UPDATE_DOCUMENT_FAILURE,
  errorMessages,
  httpCode
});

export const resetApiMessages = () => ({
  type: RESET_API_MESSAGES
});

// From https://stackoverflow.com/a/42483509/16600080
// FormData can't send null values, so we omit them.
const buildFormData = (formData, data, parentKey) => {
  if (
    data &&
    typeof data === 'object' &&
    !(data instanceof Date) &&
    !(data instanceof File)
  ) {
    keys(data).forEach(key => {
      buildFormData(
        formData,
        data[key],
        parentKey ? `${parentKey}[${key}]` : key
      );
    });
  } else if (data || data === '') {
    formData.append(parentKey, data);
  }
};

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

export function updateDocument(docAttributes) {
  return (dispatch, getState) => {
    dispatch(updateDocumentAction());

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
    let indexDeleted = 0;
    let indexModified = 0;
    files.forEach(file => {
      // For a file that is modified or intact, baseFile corresponds to the file entity of the database.
      const {
        name,
        extension,
        file: fileObjectJS,
        state,
        previousState,
        ...baseFile
      } = file;
      switch (state) {
        case IS_NEW:
          formData.append('files', fileObjectJS, `${name}.${extension}`);
          break;
        case IS_MODIFIED:
          baseFile.fileName = `${name}.${extension}`;
          buildFormData(formData, baseFile, `modifiedFiles[${indexModified}]`);
          indexModified += 1;
          break;
        case IS_DELETED:
          buildFormData(formData, baseFile, `deletedFiles[${indexDeleted}]`);
          indexDeleted += 1;
          break;
        default:
      }
    });

    const requestOptions = {
      method: 'PUT',
      body: formData,
      headers: getState().login.authorizationHeader
    };

    return fetch(putDocumentUrl(docAttributes.id), requestOptions).then(
      response =>
        response.text().then(responseText => {
          if (response.status >= 400) {
            const errorMessages = [];
            switch (response.status) {
              case 400:
                errorMessages.push(`Bad request: ${responseText}`);
                break;
              case 401:
                errorMessages.push(
                  'You must be authenticated to update a document.'
                );
                break;
              case 403:
                errorMessages.push(
                  'You are not authorized to update a document.'
                );
                break;
              case 404:
                errorMessages.push(
                  'Server-side update of the document is not available.'
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
            dispatch(updateDocumentFailure(errorMessages, response.status));
            throw new Error(
              `Fetching ${putDocumentUrl} status: ${response.status}`,
              errorMessages
            );
          } else {
            dispatch(updateDocumentSuccess(response.status));
          }
          return response;
        })
    );
  };
}

export const updateDocumentWithNewEntities = (
  docAttributes,
  newAuthors,
  newDescriptions
) => (dispatch, getState) => {
  dispatch(updateDocumentAction());
  const { id } = docAttributes;
  const body = {
    document: docAttributes,
    newAuthors,
    newDescriptions
  };

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: getState().login.authorizationHeader
  };

  return fetch(putDocumentyWithNewEntitiesUrl(id), requestOptions)
    .then(checkAndGetStatus)
    .then(response => {
      dispatch(updateDocumentSuccess(response.status));
    })
    .catch(error => {
      dispatch(
        updateDocumentFailure(
          [`Unable to update the document id ${id}`],
          error.message
        )
      );
    });
};
