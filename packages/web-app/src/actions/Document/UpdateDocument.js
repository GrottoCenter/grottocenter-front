import fetch from 'isomorphic-fetch';
import {
  IS_DELETED,
  IS_MODIFIED,
  IS_NEW
} from '../../components/common/AddFileForm/FileHelpers';
import {
  putDocumentUrl,
  putDocumentyWithNewEntitiesUrl
} from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';
import { buildFormData } from './utils';

// ==========

export const UPDATE_DOCUMENT = 'UPDATE_DOCUMENT';
export const UPDATE_DOCUMENT_SUCCESS = 'UPDATE_DOCUMENT_SUCCESS';
export const UPDATE_DOCUMENT_FAILURE = 'UPDATE_DOCUMENT_FAILURE';

// ==========

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

export function updateDocument(docAttributes) {
  return (dispatch, getState) => {
    dispatch(updateDocumentAction());
    const attributes = { ...docAttributes };
    const { files } = attributes;
    delete attributes.files;

    const formData = new FormData();
    buildFormData(formData, attributes);

    // Files must have the same key name for each file, as it is asked by the parser on server side.
    let indexDeleted = 0;
    let indexModified = 0;
    for (const file of files) {
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
    }

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

export const updateDocumentWithNewEntities =
  (docAttributes, newAuthors, newDescriptions) => (dispatch, getState) => {
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
            [`Unable to update the document with id ${id}`],
            error.message
          )
        );
      });
  };
