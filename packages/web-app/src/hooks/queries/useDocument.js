import { useQuery } from '@tanstack/react-query';

import { documentQueryOptions } from '@/api/documentQueryOptions';

/**
 * The full detail payload of a document.
 *
 * `requireUpdate` asks the API for the snapshot version a moderator can act
 * on — same document id, different payload. It has to be part of the query
 * key so the two shapes never overwrite each other in cache.
 *
 * @param {number|string} documentId
 * @param {{ requireUpdate?: boolean }} [options]
 */
export const useDocument = (documentId, { requireUpdate } = {}) =>
  useQuery(documentQueryOptions(documentId, { requireUpdate }));

export default useDocument;
