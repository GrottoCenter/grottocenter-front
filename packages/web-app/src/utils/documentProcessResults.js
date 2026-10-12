export const DOCUMENT_PROCESS_STATUSES = [
  'validated',
  'rejected',
  'auto_rejected',
  'not_found',
  'error',
  'indeterminate'
];

export const isDocumentProcessFinished = result =>
  ['validated', 'rejected', 'auto_rejected', 'not_found'].includes(
    result.status
  );

// Match only submitted IDs, once each. Missing or ambiguous answers cannot
// establish whether a write reached the server.
export const normalizeDocumentProcessResults = (response, ids) =>
  [...new Set(ids)].map(id => {
    const matches = Array.isArray(response)
      ? response.filter(result => result?.id === id)
      : [];
    const result = matches[0];
    const isValid =
      matches.length === 1 &&
      DOCUMENT_PROCESS_STATUSES.slice(0, -1).includes(result.status) &&
      (result.reason == null || typeof result.reason === 'string') &&
      (result.status !== 'auto_rejected' || !!result.reason?.trim());
    return isValid
      ? { id, status: result.status, reason: result.reason ?? null }
      : { id, status: 'indeterminate', reason: null };
  });

export const formatDocumentProcessSummary = (results, formatMessage) =>
  DOCUMENT_PROCESS_STATUSES.map(status => {
    const count = results.filter(result => result.status === status).length;
    return count
      ? formatMessage({ id: `documentProcess.count.${status}` }, { count })
      : null;
  })
    .filter(Boolean)
    .join(', ');
