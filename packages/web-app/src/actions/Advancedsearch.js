import { advancedSearchExportUrl } from '../conf/apiRoutes';
import { VALID_EXPORT_FORMATS } from '../conf/exportFormats';
import { checkAndGetStatus } from './utils';

// Advanced-search results migrated to React Query — see hooks/queries/useAdvancedSearch.js.
// This file kept only the CSV/GeoJSON/GPX/KML export because it downloads a
// Blob, not JSON, so it doesn't fit apiPost's parseJsonOr204 contract.
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
