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
import { logout } from './Login';

// Remove the next line when other exports are created.
export const makeUrl = (url, criterias) => {
  if (criterias) {
    return `${url}?${Object.keys(criterias)
      .map(k => `${k}=${encodeURIComponent(criterias[k])}`)
      .join('&')}`;
  }
  return url;
};

export const checkAndGetStatus = async response => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  if (response.status === 401) {
    // eslint-disable-next-line global-require
    const gcStore = require('../store').default;
    gcStore.dispatch(logout());
    return response;
  }
  const errorMessage = new Error(response.status);
  try {
    errorMessage.body = await response.json();
    if (errorMessage.body?.message) {
      errorMessage.message = errorMessage.body.message;
    }
  } catch (_) {
    // ignore if body is not JSON
  }
  throw errorMessage;
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
