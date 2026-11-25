import { apiPostBlob } from '@/api/client';
import { downloadBlob } from '@/components/common/DocumentsList/utils/imageUtils';
import { advancedSearchExportUrl } from '../conf/apiRoutes';
import { VALID_EXPORT_FORMATS } from '../conf/exportFormats';

// Advanced-search results migrated to React Query — see hooks/queries/useAdvancedSearch.js.
// This file kept only the CSV/GeoJSON/GPX/KML export because it downloads a
// Blob, not JSON, so it doesn't fit apiPost's parseJsonOr204 contract.
export const fetchAdvancedSearchExport = async ({
  query,
  entity,
  sort,
  filter,
  matchAllFields = true,
  includePendingDocuments = false,
  columns,
  columnsName,
  format = 'csv',
  signal
}) => {
  const safeFormat = VALID_EXPORT_FORMATS.has(format) ? format : 'csv';
  const data = {
    query,
    entity,
    sort,
    filter,
    matchAllFields,
    columns,
    columnsName,
    ...(includePendingDocuments && { includePendingDocuments: true })
  };
  const exportUrl = `${advancedSearchExportUrl}?format=${encodeURIComponent(safeFormat)}`;
  return apiPostBlob(exportUrl, data, { signal });
};

export const downloadAdvancedSearchResults = async options => {
  try {
    const blob = await fetchAdvancedSearchExport(options);
    const format = VALID_EXPORT_FORMATS.has(options.format)
      ? options.format
      : 'csv';
    downloadBlob(
      blob,
      `Grottocenter_search_export_${Math.trunc(Date.now() / 1000)}.${format}`
    );
  } catch (error) {
    console.error('downloadAdvancedSearchResults error', error);
  }
};
