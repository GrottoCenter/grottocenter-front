import fetch from 'isomorphic-fetch';
import { getMassifEntrancesUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const FETCH_MASSIF_ENTRANCES_DATA_QUALITY_SUCCESS =
  'FETCH_MASSIF_ENTRANCES_DATA_QUALITY_SUCCESS';
export const FETCH_MASSIF_ENTRANCES_DATA_QUALITY_LOADING =
  'FETCH_MASSIF_ENTRANCES_DATA_QUALITY_LOADING';
export const FETCH_MASSIF_ENTRANCES_DATA_QUALITY_ERROR =
  'FETCH_MASSIF_ENTRANCES_DATA_QUALITY_ERROR';

export const fetchMassifEntrances =
  (massifId, { limit, offset } = {}) =>
  (dispatch, getState) => {
    dispatch({ type: FETCH_MASSIF_ENTRANCES_DATA_QUALITY_LOADING });
    const requestOptions = {
      headers: {
        ...getState().login.authorizationHeader
      }
    };
    return fetch(
      getMassifEntrancesUrl(massifId, { limit, offset }),
      requestOptions
    )
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(data => {
        dispatch({ type: FETCH_MASSIF_ENTRANCES_DATA_QUALITY_SUCCESS, data });
      })
      .catch(error =>
        dispatch({
          type: FETCH_MASSIF_ENTRANCES_DATA_QUALITY_ERROR,
          error: makeErrorMessage(
            error.message,
            `Fetching entrances of massif id ${massifId}`
          )
        })
      );
  };
