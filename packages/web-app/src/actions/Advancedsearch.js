import fetch from 'isomorphic-fetch';
import { advancedSearchUrl, advancedSearchExportUrl } from '../conf/apiRoutes';
import { VALID_EXPORT_FORMATS } from '../conf/exportFormats';
import { checkAndGetStatus } from './utils';

export const FETCH_ADVANCEDSEARCH = 'FETCH_ADVANCEDSEARCH';
export const FETCH_ADVANCEDSEARCH_SUCCESS = 'FETCH_ADVANCEDSEARCH_SUCCESS';
export const FETCH_ADVANCEDSEARCH_FAILURE = 'FETCH_ADVANCEDSEARCH_FAILURE';
export const RESET_ADVANCEDSEARCH_RESULTS = 'RESET_ADVANCEDSEARCH_RESULTS';

const fetchAdvancedsearchStarted = (queryParams, isNewQuery) => ({
  type: FETCH_ADVANCEDSEARCH,
  queryParams,
  isNewQuery
});

const fetchAdvancedsearchSuccess = d => ({
  type: FETCH_ADVANCEDSEARCH_SUCCESS,
  totalResults: d.totalResults,
  results: d.results
});

const fetchAdvancedsearchFailure = error => ({
  type: FETCH_ADVANCEDSEARCH_FAILURE,
  error
});

export const resetAdvancedSearchResults = () => ({
  type: RESET_ADVANCEDSEARCH_RESULTS
});

export const fetchAdvancedSearchResults =
  (
    { query, entity, sort, filter, matchAllFields = true, page = 0, size = 20 },
    isNewQuery = true
  ) =>
  dispatch => {
    const data = { query, entity, sort, filter, matchAllFields, page, size };
    dispatch(fetchAdvancedsearchStarted(data, isNewQuery));

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    return fetch(advancedSearchUrl, requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(d => dispatch(fetchAdvancedsearchSuccess(d)))
      .catch(errorMessage => {
        dispatch(fetchAdvancedsearchFailure(errorMessage));
      });
  };

export const downloadAdvancedSearchResults = async ({
  query,
  entity,
  sort,
  filter,
  matchAllFields = true,
  columns,
  columnsName,
  format = 'csv'
}) => {
  const safeFormat = VALID_EXPORT_FORMATS.has(format) ? format : 'csv';
  const data = {
    query,
    entity,
    sort,
    filter,
    matchAllFields,
    columns,
    columnsName
  };
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(data)
  };

  const exportUrl = `${advancedSearchExportUrl}?format=${encodeURIComponent(safeFormat)}`;

  const blob = await fetch(exportUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.blob())
    .catch(errorMessage => {
      console.error('downloadAdvancedSearchResults error', data, errorMessage);
    });

  if (!blob) return;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Grottocenter_search_export_${Math.trunc(Date.now() / 1000)}.${safeFormat}`;
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
};
