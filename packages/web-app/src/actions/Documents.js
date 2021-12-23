import fetch from 'isomorphic-fetch';
import {
  pipe,
  keys,
  map,
  join,
  isNil,
  pathOr,
  split,
  tail,
  ifElse,
  identity,
  always,
  defaultTo,
  equals
} from 'ramda';
import {
  getDocuments as queryDocuments,
  getCaversDocumentsUrl
} from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

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

const doGet = (url, criteria) => {
  const makeUrl = pipe(
    keys,
    map(c => `${c}=${encodeURIComponent(criteria[c])}`),
    join('&'),
    urlCriteria => `${url}?${urlCriteria}`
  );

  return async dispatch => {
    dispatch(fetchDocuments());

    try {
      const res = await fetch(isNil(criteria) ? url : makeUrl(criteria)).then(
        response => {
          if (response.status >= 400) {
            throw new Error(response.status);
          }
          return response;
        }
      );
      const data = await res.text();
      const header = await res.headers.get('Content-Range');
      const makeNumber = ifElse(identity, Number, always(1));
      const getTotalCount = defaultCount =>
        pipe(
          defaultTo(''),
          split('/'),
          tail,
          makeNumber,
          ifElse(equals(0), always(defaultCount), identity)
        )(header);

      const parsedData = pathOr(['documents'], [], JSON.parse(data));
      const successAction =
        criteria && criteria.documentType === 'Authorization To Publish'
          ? fetchAuthorizationDocumentsSuccess
          : fetchDocumentsSuccess;
      return dispatch(
        successAction({
          documents: parsedData.documents,
          totalCount: getTotalCount(parsedData.documents.length)
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
};

export const getDocuments = criteria => doGet(queryDocuments, criteria);

export const getUsersDocuments = (userId, criteria) =>
  doGet(getCaversDocumentsUrl(userId), criteria);
