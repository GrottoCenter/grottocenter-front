import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { apiGetWithRange } from '@/api/client';
import { documentKeys } from '@/api/queryKeys';
import { getTotalCount, makeUrl } from '@/actions/utils';
import { getDocumentsUrl } from '@/conf/apiRoutes';
import {
  getPdfsWithoutOffset,
  PDF_OFFSET_DOCUMENT_TYPES
} from '@/utils/documentPdfOffsets';

const PAGE_SIZE = 100;
const DOCUMENTS_PER_CHUNK = 1000;
const hasTotal = page => /\/\d+$/.test(page.contentRange ?? '');
const INITIAL_CURSOR = {
  pending: PDF_OFFSET_DOCUMENT_TYPES.map(documentType => ({
    documentType,
    skip: 0
  })),
  totals: {},
  loaded: 0
};

const selectDocuments = data => ({
  ...data,
  documents: [
    ...new Map(
      data.pages
        .flatMap(page => page.documents)
        .map(document => [String(document.id), document])
    ).values()
  ],
  progress: data.pages.at(-1).progress
});

export const useDocumentsWithoutPdfOffset = ({ ignoredIds } = {}) => {
  const ignoredRef = useRef(ignoredIds);
  useEffect(() => {
    ignoredRef.current = ignoredIds;
  }, [ignoredIds]);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const query = useInfiniteQuery({
    queryKey: documentKeys.missingPdfOffsets(PDF_OFFSET_DOCUMENT_TYPES),
    enabled: false,
    retry: false,
    gcTime: 60 * 1000,
    select: selectDocuments,
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: lastPage => lastPage.nextCursor,
    queryFn: async ({ pageParam, signal }) => {
      // Work on copies: a failed or cancelled batch must leave its cursor intact.
      let pending = [...pageParam.pending];
      const totals = { ...pageParam.totals };
      let { loaded } = pageParam;
      let chunkStart = loaded;
      let hasMatches = false;
      const documents = [];
      const ignored = ignoredRef.current ?? new Set();
      const getProgress = () => ({
        loaded,
        total: Object.values(totals).reduce((sum, count) => sum + count, 0)
      });
      setProgress(getProgress());
      while (pending.length) {
        signal.throwIfAborted();
        const remaining = DOCUMENTS_PER_CHUNK - (loaded - chunkStart);
        const batch = pending
          .slice(0, Math.ceil(remaining / PAGE_SIZE))
          .map((cursor, index) => ({
            ...cursor,
            limit: Math.min(PAGE_SIZE, remaining - index * PAGE_SIZE)
          }));
        // The API caps each request at 100 rows. Allocate the remaining chunk
        // across types, and keep requests sequential between batches to cancel.
        // eslint-disable-next-line no-await-in-loop
        const pages = await Promise.all(
          batch.map(async ({ documentType, skip, limit }) => ({
            documentType,
            skip,
            limit,
            ...(await apiGetWithRange(
              makeUrl(getDocumentsUrl, {
                isValidated: true,
                documentType,
                limit,
                skip,
                sortBy: 'id',
                orderBy: 'ASC'
              }),
              { signal }
            ))
          }))
        );
        signal.throwIfAborted();
        loaded += pages.reduce(
          (count, page) => count + page.data.documents.length,
          0
        );
        const next = pages.flatMap(page => {
          const count = page.data.documents.length;
          const skip = page.skip + count;
          const total = hasTotal(page)
            ? getTotalCount(0, page.contentRange)
            : Math.max(skip, totals[page.documentType] ?? 0);
          if (!count && skip < total)
            throw new Error('Incomplete documents scan');
          totals[page.documentType] = total;
          const hasMore =
            skip < total || (!hasTotal(page) && count === page.limit);
          return count && hasMore
            ? [{ documentType: page.documentType, skip }]
            : [];
        });
        pending = [...pending.slice(batch.length), ...next];
        const matches = pages
          .flatMap(page => page.data.documents)
          .filter(document => getPdfsWithoutOffset(document).length);
        documents.push(...matches);
        hasMatches ||= matches.some(
          document => !ignored.has(String(document.id))
        );
        setProgress(getProgress());
        if (loaded - chunkStart === DOCUMENTS_PER_CHUNK) {
          if (hasMatches) break;
          chunkStart = loaded;
        }
      }
      return {
        documents,
        progress: getProgress(),
        nextCursor: pending.length ? { pending, totals, loaded } : undefined
      };
    }
  });
  return { ...query, progress };
};
