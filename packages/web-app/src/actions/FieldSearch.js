import fetch from 'isomorphic-fetch';
import { fieldSearchUrl } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';

// eslint-disable-next-line import/prefer-default-export
export const fetchFieldSearch = ({ entity, field, query, filter }) => {
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ entity, field, query, filter, size: 10 })
  };

  return fetch(fieldSearchUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json());
};
