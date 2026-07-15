import {
  pipe,
  split,
  tail,
  ifElse,
  identity,
  always,
  defaultTo,
  equals
} from 'ramda';
// Static import is safe: Login.js does not import utils.js, so no circular dep.
// (Was a lazy require() to guard against circularity; replaced with a static
// import because Vitest's vi.mock hoisting cannot intercept runtime require().)
import { postLogout } from './Login';

// Remove the next line when other exports are created.
export const makeUrl = (url, criterias) => {
  if (criterias) {
    return `${url}?${Object.keys(criterias)
      .map(k => `${k}=${encodeURIComponent(criterias[k])}`)
      .join('&')}`;
  }
  return url;
};

export const checkAndGetStatus = response => {
  if (response.status >= 200 && response.status <= 300) {
    return response;
  }
  return response
    .json()
    .then(body => {
      const errorMessage = new Error(body.message || response.status);
      errorMessage.body = body;
      errorMessage.status = response.status;
      throw errorMessage;
    })
    .catch(err => {
      if (err.body) throw err;
      const errorMessage = new Error(response.status);
      errorMessage.status = response.status;
      throw errorMessage;
    });
};

const makeNumber = ifElse(identity, Number, always(1));
export const getTotalCount = (defaultCount, contentRangeHeader) =>
  pipe(
    defaultTo(''),
    split('/'),
    tail,
    makeNumber,
    ifElse(equals(0), always(defaultCount), identity)
  )(contentRangeHeader);

export const convertKmIntoMiles = km => km * 0.621371;

export const checkAuthStatus = dispatch => response => {
  if (response.status === 401) {
    dispatch(postLogout());
    const err = new Error('Unauthorized');
    err.isAuthError = true;
    throw err;
  }
  return checkAndGetStatus(response);
};
