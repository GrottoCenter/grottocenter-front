import fetch from 'isomorphic-fetch';
import { associateDocumentToEntranceUrl } from '../conf/Config';

export const ASSOCIATE_DOCUMENT_TO_ENTRANCE = 'ASSOCIATE_DOCUMENT_TO_ENTRANCE';
export const ASSOCIATE_DOCUMENT_TO_ENTRANCE_SUCCESS =
  'ASSOCIATE_DOCUMENT_TO_ENTRANCE_SUCCESS';
export const ASSOCIATE_DOCUMENT_TO_ENTRANCE_FAILURE =
  'ASSOCIATE_DOCUMENT_TO_ENTRANCE_FAILURE';

export const associateDocumentToEntranceAction = () => ({
  type: ASSOCIATE_DOCUMENT_TO_ENTRANCE
});

export const associateDocumentToEntranceSuccess = document => ({
  type: ASSOCIATE_DOCUMENT_TO_ENTRANCE_SUCCESS,
  document
});

export const associateDocumentToEntranceFailure = error => ({
  type: ASSOCIATE_DOCUMENT_TO_ENTRANCE_FAILURE,
  error
});

export const associateDocumentToEntrance = ({ entranceId, documentId }) => (
  dispatch,
  getState
) => {
  dispatch(associateDocumentToEntranceAction());

  const requestOptions = {
    method: 'PUT',
    headers: getState().login.authorizationHeader
  };

  return fetch(
    associateDocumentToEntranceUrl(entranceId, documentId),
    requestOptions
  )
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return dispatch(associateDocumentToEntranceSuccess());
    })
    .catch(errorMessage => {
      dispatch(associateDocumentToEntranceFailure(errorMessage));
    });
};
