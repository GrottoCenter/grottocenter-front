import { fieldSearchUrl } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';

export const fetchFieldSearch = ({ entity, field, query, filter }) => {
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ entity, field, query, filter, size: 10 })
  };

  return fetch(fieldSearchUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json());
};
