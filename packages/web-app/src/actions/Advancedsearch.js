import fetch from 'isomorphic-fetch';
import { advancedsearchUrl } from '../conf/apiRoutes';

export const FETCH_ADVANCEDSEARCH_STARTED = 'FETCH_ADVANCEDSEARCH_STARTED';
export const FETCH_ADVANCEDSEARCH_SUCCESS = 'FETCH_ADVANCEDSEARCH_SUCCESS';
export const FETCH_ADVANCEDSEARCH_FAILURE = 'FETCH_ADVANCEDSEARCH_FAILURE';

export const FETCH_NEXT_ADVANCEDSEARCH_STARTED =
  'FETCH_NEXT_ADVANCEDSEARCH_STARTED';
export const FETCH_NEXT_ADVANCEDSEARCH_SUCCESS =
  'FETCH_NEXT_ADVANCEDSEARCH_SUCCESS';
export const FETCH_NEXT_ADVANCEDSEARCH_FAILURE =
  'FETCH_NEXT_ADVANCEDSEARCH_FAILURE';

export const FETCH_FULL_ADVANCEDSEARCH_STARTED =
  'FETCH_FULL_ADVANCEDSEARCH_STARTED';
export const FETCH_FULL_ADVANCEDSEARCH_SUCCESS =
  'FETCH_FULL_ADVANCEDSEARCH_SUCCESS';
export const FETCH_FULL_ADVANCEDSEARCH_FAILURE =
  'FETCH_FULL_ADVANCEDSEARCH_FAILURE';

export const RESET_ADVANCEDSEARCH_RESULTS = 'RESET_ADVANCEDSEARCH_RESULTS';

// Start an advanced search from nothing
export const fetchAdvancedsearchStarted = criterias => ({
  type: FETCH_ADVANCEDSEARCH_STARTED,
  criterias
});

export const fetchAdvancedsearchSuccess = (results, totalNbResults) => ({
  type: FETCH_ADVANCEDSEARCH_SUCCESS,
  totalNbResults,
  results
});

export const fetchAdvancedsearchFailure = error => ({
  type: FETCH_ADVANCEDSEARCH_FAILURE,
  error
});

// Get next page of an existing advanced search
export const fetchNextAdvancedSearchStarted = criterias => ({
  type: FETCH_NEXT_ADVANCEDSEARCH_STARTED,
  criterias
});

export const fetchNextAdvancedSearchSucess = results => ({
  type: FETCH_NEXT_ADVANCEDSEARCH_SUCCESS,
  results
});

export const fetchNextAdvancedSearchFailure = error => ({
  type: FETCH_NEXT_ADVANCEDSEARCH_FAILURE,
  error
});

// Get all results from the previous search criterias
export const fetchFullAdvancedSearchStarted = criterias => ({
  type: FETCH_FULL_ADVANCEDSEARCH_STARTED,
  criterias
});

export const fetchFullAdvancedSearchSucess = results => ({
  type: FETCH_FULL_ADVANCEDSEARCH_SUCCESS,
  results
});

export const fetchFullAdvancedSearchFailure = error => ({
  type: FETCH_FULL_ADVANCEDSEARCH_FAILURE,
  error
});

// Reset everything
export const resetAdvancedSearchResults = () => ({
  type: RESET_ADVANCEDSEARCH_RESULTS
});

const formatAdvancedSearchParams = (values, resourceType) => {
  // complete is set to true because we need the complete results about the data
  // resourceType is set to "entrances", "grottos", "massifs" or "documents"
  // according to the search desired
  const paramsToSend = {
    complete: true,
    resourceType,
    from: 0,
    size: 20
  };

  Object.keys(values).forEach(key => {
    let keyValue = values[key];

    // If String trim it
    if (typeof values[key] === 'string') {
      keyValue = values[key].trim();
    }

    // Handle range values
    if (keyValue !== '' && key.split('-range').length === 1) {
      paramsToSend[key] = keyValue;

      // If the key contains '-range' and it is editable
      // then we send the parameter in two parameters min and max
    } else if (key.split('-range').length > 1 && keyValue.isEditable === true) {
      const keyBase = key.split('-range');
      const rangeMin = `${keyBase[0]}-min`;
      const rangeMax = `${keyBase[0]}-max`;

      paramsToSend[rangeMin] = keyValue.min;
      paramsToSend[rangeMax] = keyValue.max;
    }
  });
  return paramsToSend;
};

// ===============================

export const fetchAdvancedsearchResults =
  (parameters, resourceType) => dispatch => {
    const criterias = formatAdvancedSearchParams(parameters, resourceType);
    dispatch(fetchAdvancedsearchStarted(criterias));

    let completeUrl = advancedsearchUrl;
    if (criterias) {
      completeUrl += `?${Object.keys(criterias)
        .map(k => `${k}=${encodeURIComponent(criterias[k])}`)
        .join('&')}`;
    }

    return fetch(completeUrl, { method: 'POST' })
      .then(response => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${completeUrl} status: ${response.status}`;
          dispatch(fetchAdvancedsearchFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then(text => {
        const response = JSON.parse(text);
        dispatch(
          fetchAdvancedsearchSuccess(response.results, response.totalNbResults)
        );
      });
  };

export const fetchNextAdvancedsearchResults =
  (from, size) => (dispatch, getState) => {
    const currentState = getState().advancedsearch;

    // Load only new data (to avoid duplicates)
    const newFrom = currentState.results.length;
    const newSize = from + size - currentState.results.length;

    const criterias = {
      ...currentState.searchCriterias,
      from: newFrom,
      size: newSize
    };

    dispatch(fetchNextAdvancedSearchStarted(criterias));

    let completeUrl = advancedsearchUrl;
    if (criterias) {
      completeUrl += `?${Object.keys(criterias)
        .map(k => `${k}=${encodeURIComponent(criterias[k])}`)
        .join('&')}`;
    }

    return fetch(completeUrl, { method: 'POST' })
      .then(response => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${completeUrl} status: ${response.status}`;
          dispatch(fetchNextAdvancedSearchFailure(errorMessage));
          throw new Error(errorMessage);
        }
        return response.text();
      })
      .then(text => {
        const response = JSON.parse(text);
        dispatch(fetchNextAdvancedSearchSucess(response.results));
      });
  };

export const fetchFullAdvancedsearchResults = () => (dispatch, getState) => {
  const currentState = getState().advancedsearch;

  // Load all data
  const criterias = {
    ...currentState.searchCriterias,
    from: 0,
    size: currentState.totalNbResults
  };

  dispatch(fetchFullAdvancedSearchStarted(criterias));

  let completeUrl = advancedsearchUrl;
  if (criterias) {
    completeUrl += `?${Object.keys(criterias)
      .map(k => `${k}=${encodeURIComponent(criterias[k])}`)
      .join('&')}`;
  }

  return fetch(completeUrl, { method: 'POST' })
    .then(response => {
      if (response.status >= 400) {
        const errorMessage = `Fetching ${completeUrl} status: ${response.status}`;
        dispatch(fetchFullAdvancedSearchFailure(errorMessage));
        throw new Error(errorMessage);
      }
      return response.text();
    })
    .then(text => {
      const response = JSON.parse(text);
      dispatch(fetchFullAdvancedSearchSucess(response.results));
    });
};
