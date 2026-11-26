// Temporary organization cleanup. Keep the audit and transfer protocol here so
// this feature can be removed without changing the ordinary entity workflows.
// Audits and writes are sequential: stop at the first incomplete page or failure.
/* eslint-disable no-await-in-loop */
import { apiGet, apiGetWithRange, apiPost, apiPut } from '@/api/client';
import { makeUrl } from '@/actions/utils';
import { deletedEntitiesQueryOptions } from '@/api/deletedEntitiesQueryOptions';
import {
  advancedSearchUrl,
  getCaverUrl,
  getDocumentDetailsUrl,
  getDocumentsUrl,
  getOrganizationUrl,
  putDocumentyWithNewEntitiesUrl
} from '@/conf/apiRoutes';

export const PAGE_SIZE = 20;

export const cleanupError = (key, values = {}) =>
  Object.assign(new Error(key), {
    code: `organizationConversion.${key}`,
    values
  });

export const sameId = (a, b) => String(a) === String(b);

// A NetworkFirst service-worker fallback must never authorize a destructive
// operation using cached relations. Each audit read gets an uncached URL.
const freshUrl = url =>
  `${url}${url.includes('?') ? '&' : '?'}conversionCheck=${crypto.randomUUID()}`;

export const getOrganization = id =>
  apiGet(freshUrl(`${getOrganizationUrl}${id}`));

const hasOrganization = (document, id) =>
  document.authorsOrganization.some(author => sameId(author.id, id));

const assertDocument = document => {
  if (
    !document?.id ||
    !Array.isArray(document.authors) ||
    !Array.isArray(document.authorsOrganization)
  ) {
    throw cleanupError('incompleteAudit');
  }
  return document;
};

const assertCurrentDocument = document => {
  assertDocument(document);
  if (document.isDeleted || document.validationStatus !== 'validated') {
    throw cleanupError('documentChanged', { id: document.id });
  }
  return document;
};

export const getOtherOrganizations = ({ pageParam, signal }) =>
  apiPost(
    advancedSearchUrl,
    {
      entity: 'organizations',
      query: '',
      filter: { type: ['OTHER'] },
      matchAllFields: true,
      sort: 'name:asc',
      page: pageParam,
      size: PAGE_SIZE
    },
    { signal }
  );

export const getOrganizationBlockers = organization => {
  if (
    !organization ||
    !Number.isInteger(organization.authoredCount) ||
    !Number.isInteger(organization.publishedCount) ||
    ![
      'cavers',
      'exploredEntrances',
      'exploredNetworks',
      'partnerEntrances',
      'partnerNetworks',
      'managedCountries',
      'managedRegions',
      'managedMassifs'
    ].every(field => Array.isArray(organization[field]))
  ) {
    throw cleanupError('incompleteAudit');
  }
  const counts = {
    published: organization.publishedCount,
    members: organization.cavers.length,
    explored:
      organization.exploredEntrances.length +
      organization.exploredNetworks.length,
    partners:
      organization.partnerEntrances.length +
      organization.partnerNetworks.length,
    managed:
      organization.managedCountries.length +
      organization.managedRegions.length +
      organization.managedMassifs.length,
    officialPartner: organization.isOfficialPartner ? 1 : 0
  };
  if (organization.isDeleted || organization.type !== 'OTHER') {
    return [{ key: 'organizationChanged', count: 1 }];
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, count }));
};

const readSearch = async (filter, signal) => {
  const documents = new Map();
  let total;
  let loaded = 0;
  let page = 1;
  do {
    signal?.throwIfAborted();
    const result = await apiPost(
      advancedSearchUrl,
      {
        entity: 'documents',
        query: '',
        filter,
        matchAllFields: true,
        includePendingDocuments: true,
        page,
        size: 100
      },
      { signal }
    );
    if (
      !Array.isArray(result.results) ||
      !Number.isInteger(result.totalResults) ||
      (total !== undefined && total !== result.totalResults) ||
      (!result.results.length && loaded < result.totalResults)
    ) {
      throw cleanupError('incompleteAudit');
    }
    total = result.totalResults;
    result.results.forEach(document => {
      // Search relations are display summaries: organization authors and
      // libraries have names but no IDs. Only use the document ID here.
      if (!document?.id) throw cleanupError('incompleteAudit');
      documents.set(String(document.id), document);
    });
    loaded += result.results.length;
    page += 1;
  } while (loaded < total);
  if (documents.size !== total) throw cleanupError('incompleteAudit');
  const fullDocuments = [];
  for (const document of documents.values()) {
    signal?.throwIfAborted();
    fullDocuments.push(
      assertDocument(
        await apiGet(freshUrl(`${getDocumentDetailsUrl}${document.id}`))
      )
    );
  }
  return fullDocuments;
};

// The collection endpoints expose no organization filter. Scan every page,
// including pending snapshots: a later validation must not bring the org back.
const scanDocumentCollection = async ({ isDeleted, signal, onProgress }) => {
  const documents = new Map();
  let total;
  let skip = 0;
  do {
    signal?.throwIfAborted();
    let entities;
    let totalCount;
    if (isDeleted) {
      const options = deletedEntitiesQueryOptions({
        entityType: 'documents',
        skip,
        limit: 100
      });
      const response = await apiGetWithRange(
        freshUrl(
          makeUrl(getDocumentsUrl, { isDeleted: true, skip, limit: 100 })
        ),
        { signal }
      );
      ({ entities, totalCount } = options.select(response));
    } else {
      const { data, contentRange } = await apiGetWithRange(
        freshUrl(
          makeUrl(getDocumentsUrl, {
            isValidated: false,
            sortBy: 'id',
            orderBy: 'ASC',
            skip,
            limit: 100
          })
        ),
        { signal }
      );
      entities = data?.documents;
      const match = contentRange?.match(/\/(\d+)$/);
      if (!Array.isArray(entities) || (!match && entities.length > 0)) {
        throw cleanupError('incompleteAudit');
      }
      totalCount = match ? Number(match[1]) : 0;
    }
    if (
      (total !== undefined && total !== totalCount) ||
      (!entities.length && skip < totalCount)
    ) {
      throw cleanupError('incompleteAudit');
    }
    total = totalCount;
    onProgress?.({
      phase: isDeleted ? 'checkingDeleted' : 'checkingPending',
      done: skip,
      total
    });
    for (const item of entities) {
      assertDocument(item);
      documents.set(String(item.id), item);
      if (!isDeleted) {
        signal?.throwIfAborted();
        const pending = assertDocument(
          await apiGet(
            freshUrl(`${getDocumentDetailsUrl}${item.id}?requireUpdate=true`)
          )
        );
        // Keep both the current relations and their proposed replacement.
        documents.set(`pending:${item.id}`, pending);
        onProgress?.({
          phase: 'checkingPending',
          done: documents.size / 2,
          total
        });
      }
    }
    skip += entities.length;
    onProgress?.({
      phase: isDeleted ? 'checkingDeleted' : 'checkingPending',
      done: skip,
      total
    });
  } while (skip < total);
  const uniqueIds = new Set([...documents.values()].map(doc => String(doc.id)));
  if (uniqueIds.size !== total) throw cleanupError('incompleteAudit');
  return [...documents.values()];
};

const indexOrganizationLinks = documents => {
  const links = new Map();
  documents.forEach(document => {
    const organizations = [
      ...document.authorsOrganization,
      document.editor,
      document.library
    ].filter(Boolean);
    if (organizations.some(organization => !organization.id)) {
      throw cleanupError('incompleteAudit');
    }
    const organizationIds = organizations.map(organization => organization.id);
    organizationIds.forEach(id => {
      const key = String(id);
      if (!links.has(key)) links.set(key, new Set());
      links.get(key).add(String(document.id));
    });
  });
  return Object.fromEntries([...links].map(([id, ids]) => [id, ids.size]));
};

// One global read per cleanup session. Cache only counts by organization,
// rather than retaining thousands of full document records in browser storage.
export const analyzeGlobalDocuments = async ({ signal, onProgress } = {}) => {
  onProgress?.({ phase: 'checkingDeleted', done: 0, total: 0 });
  const deleted = await scanDocumentCollection({
    isDeleted: true,
    signal,
    onProgress
  });
  onProgress?.({ phase: 'checkingPending', done: 0, total: 0 });
  const pending = await scanDocumentCollection({
    isDeleted: false,
    signal,
    onProgress
  });
  signal?.throwIfAborted();
  return {
    version: 1,
    analyzedAt: Date.now(),
    deleted: indexOrganizationLinks(deleted),
    pending: indexOrganizationLinks(pending)
  };
};

export const getSnapshotBlockers = (snapshot, id) => {
  if (snapshot?.version !== 1 || !snapshot.deleted || !snapshot.pending) {
    throw cleanupError('sessionUnavailable');
  }
  return ['deleted', 'pending']
    .map(key => ({ key, count: snapshot[key][String(id)] ?? 0 }))
    .filter(blocker => blocker.count > 0);
};

export const auditOrganization = async (
  id,
  { snapshot, signal, onProgress } = {}
) => {
  onProgress?.({ phase: 'checking', done: 0, total: 0 });
  const organization = await getOrganization(id);
  if (!sameId(organization?.id, id)) throw cleanupError('incompleteAudit');
  const blockers = [
    ...getOrganizationBlockers(organization),
    ...getSnapshotBlockers(snapshot, id)
  ];
  if (blockers.length) return { organization, blockers, documents: [] };

  const library = await readSearch(
    { 'library.name': organization.name },
    signal
  );
  const libraryCount = library.filter(document =>
    sameId(document.library?.id, id)
  ).length;
  if (libraryCount) blockers.push({ key: 'library', count: libraryCount });
  if (blockers.length) return { organization, blockers, documents: [] };

  const matches = await readSearch(
    { 'authorsOrganization.name': organization.name },
    signal
  );
  const authored = matches.filter(document => hasOrganization(document, id));
  // The DB count also includes refused submissions, which search does not
  // expose. A stale index or an undiscoverable document must block the cleanup.
  if (authored.length !== organization.authoredCount) {
    throw cleanupError('incompleteAudit');
  }
  const documents = [];
  for (const match of authored) {
    signal?.throwIfAborted();
    const document = assertCurrentDocument(match);
    if (!hasOrganization(document, id)) throw cleanupError('incompleteAudit');
    documents.push(document);
    onProgress?.({
      phase: 'checkingDocuments',
      done: documents.length,
      total: authored.length
    });
  }
  return { organization, blockers, documents };
};

export const getPerson = id => apiGet(freshUrl(`${getCaverUrl}${id}`));

const getAuthors = document => ({
  authors: [
    ...new Set(document.authors.map(author => String(author.id)))
  ].sort(),
  authorsOrganization: [
    ...new Set(document.authorsOrganization.map(author => String(author.id)))
  ].sort()
});

export const sameAuthors = (a, b) =>
  ['authors', 'authorsOrganization'].every(
    field => JSON.stringify(a[field]) === JSON.stringify(b[field])
  );

export const makeJournal = (organization, target, documents) => ({
  version: 1,
  organization: { id: organization.id, name: organization.name },
  target: { id: target.id, nickname: target.nickname, type: target.type },
  stage: 'transferring',
  documents: documents.map(document => {
    const before = getAuthors(document);
    return {
      id: document.id,
      before,
      after: {
        authors: [...new Set([...before.authors, String(target.id)])].sort(),
        authorsOrganization: before.authorsOrganization.filter(
          id => !sameId(id, organization.id)
        )
      },
      done: false
    };
  })
});

const applyDocumentTransfer = async entry => {
  const document = assertCurrentDocument(
    await apiGet(freshUrl(`${getDocumentDetailsUrl}${entry.id}`))
  );
  const current = getAuthors(document);
  // A lost response may have committed. Reconcile before retrying any write.
  if (sameAuthors(current, entry.after)) return;
  if (entry.done || !sameAuthors(current, entry.before)) {
    throw cleanupError('documentChanged', { id: entry.id });
  }
  await apiPut(putDocumentyWithNewEntitiesUrl(entry.id), {
    // The API's history trigger keys the old snapshot on NEW.date_reviewed.
    // Imported documents can already have that timestamp in their history.
    // Match DocumentService.updateDocument's fresh date to avoid a PK conflict.
    document: { ...entry.after, dateReviewed: new Date().toISOString() }
  });
  const verified = assertCurrentDocument(
    await apiGet(freshUrl(`${getDocumentDetailsUrl}${entry.id}`))
  );
  if (!sameAuthors(getAuthors(verified), entry.after)) {
    throw cleanupError('documentChanged', { id: entry.id });
  }
};

export const transferDocument = async entry => {
  try {
    await applyDocumentTransfer(entry);
  } catch (error) {
    // Keep the original HTTP error for the shared error presentation, with
    // enough context to find the failing document after progress stops.
    throw Object.assign(error, { documentId: entry.id });
  }
};
