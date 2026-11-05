import { useQueries } from '@tanstack/react-query';
import { documentQueryOptions } from '@/api/documentQueryOptions';
import { getPdfAttachments } from '@/pdf/shared/model';
import { sortDocuments, DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';

export const usePdfExportDocuments = ({
  listedDocuments,
  includeDocuments,
  selected,
  excluded,
  open
}) => {
  const queries = useQueries({
    queries: listedDocuments.map(document => ({
      ...documentQueryOptions(document.id),
      enabled:
        open &&
        !excluded[document.id] &&
        Boolean(includeDocuments || selected[document.id]),
      meta: { errorPresentation: 'inline' }
    }))
  });
  const rows = listedDocuments.flatMap((listed, index) => {
    if (excluded[listed.id]) return [];
    const query = queries[index];
    return [
      {
        document: query.data ?? listed,
        query,
        required: Boolean(includeDocuments || selected[listed.id])
      }
    ];
  });
  const documents = rows
    .map(row => row.document)
    .filter(document => !document.isDeleted);
  const groups = sortDocuments(documents, DOCUMENT_SORT_ORDERS.TYPE).map(
    document => {
      const row = rows.find(item => item.document.id === document.id);
      return {
        ...row,
        files: getPdfAttachments([document])
      };
    }
  );
  const required = rows.filter(row => row.required);
  return {
    documents,
    groups: groups.filter(
      row => row.files.length || (!row.query.data && row.document.files == null)
    ),
    attachments: groups.flatMap(row => row.files),
    // Shared URLs must not hide a document or assign its files to an unselected one.
    files: getPdfAttachments(
      documents.filter(document => selected[document.id])
    ),
    failedDocuments: required.filter(row => row.query.isError),
    isLoading: required.some(row => row.query.isPending),
    hasErrors: required.some(row => row.query.isError),
    isBlocked: required.some(row => row.query.isPending || row.query.isError),
    revision: required
      .map(row => `${row.document.id}:${row.query.dataUpdatedAt}`)
      .join(':')
  };
};
