import fetch from 'isomorphic-fetch';
import { pathOr } from 'ramda';
import {
  getDocumentsUrl as queryDocuments,
  getCaversDocumentsUrl
} from '../../conf/apiRoutes';
import { getTotalCount, makeUrl } from '../utils';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const FETCH_DOCUMENTS = 'FETCH_DOCUMENTS';
export const FETCH_DOCUMENTS_SUCCESS = 'FETCH_DOCUMENTS_SUCCESS';
export const FETCH_DOCUMENTS_FAILURE = 'FETCH_DOCUMENTS_FAILURE';

export const FETCH_AUTHORIZATION_DOCUMENTS_SUCCESS =
  'FETCH_AUTHORIZATION_DOCUMENTS_SUCCESS';

export const fetchDocuments = () => ({
  type: FETCH_DOCUMENTS
});

export const fetchDocumentsSuccess = data => ({
  type: FETCH_DOCUMENTS_SUCCESS,
  documents: data.documents,
  totalCount: data.totalCount
});

export const fetchDocumentsFailure = error => ({
  type: FETCH_DOCUMENTS_FAILURE,
  error
});

/*
    Why does this action exists :
    In the add/modify document form, we sometimes request the authorization documents.
    In the validation page, the state is rewritten with those documents, so it doesn't show the doc which must be validated anymore.
    So we store the authorization documents in another property of this state
*/
export const fetchAuthorizationDocumentsSuccess = data => ({
  type: FETCH_AUTHORIZATION_DOCUMENTS_SUCCESS,
  documents: data.documents,
  totalCount: data.totalCount
});

const doGet = (url, criterias) => async dispatch => {
  dispatch(fetchDocuments());

  try {
    const res = await fetch(makeUrl(url, criterias)).then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response;
    });
    const data = await res.text();
    const contentRangeHeader = await res.headers.get('Content-Range');

    const parsedData = pathOr(['documents'], [], JSON.parse(data));
    const successAction =
      criterias && criterias.documentType === 'Authorization To Publish'
        ? fetchAuthorizationDocumentsSuccess
        : fetchDocumentsSuccess;
    return dispatch(
      successAction({
        documents: parsedData.documents,
        totalCount: getTotalCount(
          parsedData.documents.length,
          contentRangeHeader
        )
      })
    );
  } catch (error) {
    return dispatch(
      fetchDocumentsFailure(
        makeErrorMessage(error.message, `Fetching documents`)
      )
    );
  }
};

export const getDocuments = criteria => doGet(queryDocuments, criteria);

export const getUsersDocuments = (userId, criteria) =>
  doGet(getCaversDocumentsUrl(userId), criteria);
