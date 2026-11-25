import { fetchWithTrace } from '@/api/transport';
import { fieldSearchUrl } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';

export const fetchFieldSearch = ({
  entity,
  field,
  query,
  filter,
  includePendingDocuments = false
}) => {
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({
      entity,
      field,
      query,
      filter,
      size: 10,
      ...(includePendingDocuments && { includePendingDocuments: true })
    })
  };

  return fetchWithTrace(fieldSearchUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json());
};
