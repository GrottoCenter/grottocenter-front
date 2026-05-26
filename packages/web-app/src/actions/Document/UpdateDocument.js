import fetch from 'isomorphic-fetch';
import {
  IS_DELETED,
  IS_MODIFIED,
  IS_NEW
} from '../../components/appli/EntitiesForm/Document/formElements/AddFileForm/FileHelpers';
import {
  putDocumentUrl,
  putDocumentyWithNewEntitiesUrl
} from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';
import { buildFormData } from './utils';
import { filterDocumentPayload } from '../../utils/documentTypeHelpers';

export const UPDATE_DOCUMENT = 'UPDATE_DOCUMENT';
export const UPDATE_DOCUMENT_SUCCESS = 'UPDATE_DOCUMENT_SUCCESS';
export const UPDATE_DOCUMENT_FAILURE = 'UPDATE_DOCUMENT_FAILURE';

const updateDocumentAction = () => ({
  type: UPDATE_DOCUMENT
});

const updateDocumentSuccess = httpCode => ({
  type: UPDATE_DOCUMENT_SUCCESS,
  httpCode
});

const updateDocumentFailure = (errorMessages, httpCode) => ({
  type: UPDATE_DOCUMENT_FAILURE,
  errorMessages,
  httpCode
});

export function updateDocument(docAttributes) {
  return (dispatch, getState) => {
    dispatch(updateDocumentAction());
    const filtered = filterDocumentPayload(docAttributes);
    const { files = [], selectOptionAuthorizationDocument, ...rest } = filtered;
    const attributes = { ...rest, option: selectOptionAuthorizationDocument };

    const formData = new FormData();
    buildFormData(formData, attributes);

    // Files must have the same key name for each file, as it is asked by the parser on server side.
    let indexDeleted = 0;
    let indexModified = 0;
    for (const file of files) {
      // For a file that is modified or intact, baseFile corresponds to the file entity of the database.
      const { file: fileObjectJS, state, ...baseFile } = file;
      switch (state) {
        case IS_NEW:
          formData.append('files', fileObjectJS, baseFile.fileName);
          break;
        case IS_MODIFIED:
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

    return fetch(putDocumentUrl(docAttributes.id), requestOptions)
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
              `Fetching ${putDocumentUrl} status: ${response.status}`
            );
          }
          dispatch(updateDocumentSuccess(response.status));
          return response;
        })
      )
      .catch(err => {
        if (err.isAuthError) return;
      });
  };
}

export const updateDocumentWithNewEntities =
  (docAttributes, newAuthors, newDescriptions) => (dispatch, getState) => {
    dispatch(updateDocumentAction());
    const { id } = docAttributes;
    // Note: unlike the updateDocument path (which uses buildFormData and skips nulls),
    // JSON.stringify includes null-valued fields. filterDocumentPayload limits the set,
    // but null fields for unused sub-types (parent, pages, issue…) will still appear in
    // the body. The API is expected to ignore irrelevant nulls; if it ever interprets
    // null as "clear this field", this path would need a null-stripping pass.
    const body = {
      document: filterDocumentPayload(docAttributes),
      newAuthors,
      newDescriptions
    };

    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: getState().login.authorizationHeader
    };

    return fetch(putDocumentyWithNewEntitiesUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => {
        dispatch(updateDocumentSuccess(response.status));
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          updateDocumentFailure(
            [`Unable to update the document with id ${id}`],
            error.message
          )
        );
      });
  };
