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
    // Lazy import to avoid potential circular dependency between
    // utils.js and Login.js (Login.js does not currently import
    // utils.js, but this keeps the modules decoupled).
    // eslint-disable-next-line global-require
    const { postLogout } = require('./Login');
    dispatch(postLogout());
    const err = new Error('Unauthorized');
    err.isAuthError = true;
    throw err;
  }
  return checkAndGetStatus(response);
};
