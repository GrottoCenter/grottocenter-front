import fetch from 'isomorphic-fetch';
import { deleteDocumentUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_DOCUMENT = 'DELETE_DOCUMENT';
export const DELETE_DOCUMENT_SUCCESS = 'DELETE_DOCUMENT_SUCCESS';
export const DELETE_DOCUMENT_PERMANENT_SUCCESS =
  'DELETE_DOCUMENT_PERMANENT_SUCCESS';
export const DELETE_DOCUMENT_FAILURE = 'DELETE_DOCUMENT_FAILURE';

const deleteDocumentAction = () => ({
  type: DELETE_DOCUMENT
});

const deleteDocumentSuccess = (data, isPermanent) => ({
  type: isPermanent
    ? DELETE_DOCUMENT_PERMANENT_SUCCESS
    : DELETE_DOCUMENT_SUCCESS,
  data
});

const deleteDocumentFailure = error => ({
  type: DELETE_DOCUMENT_FAILURE,
  error
});

export const deleteDocument =
  ({ id, entityId, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteDocumentAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(
      deleteDocumentUrl(id, { entityId, isPermanent }),
      requestOptions
    )
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deleteDocumentSuccess(data, isPermanent)))
      .catch(error => {
        dispatch(deleteDocumentFailure(error));
      });
  };
