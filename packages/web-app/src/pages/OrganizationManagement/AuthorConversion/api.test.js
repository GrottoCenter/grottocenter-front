import { apiGet, apiGetWithRange, apiPost, apiPut } from '@/api/client';
import {
  analyzeGlobalDocuments,
  auditOrganization,
  getOrganizationBlockers,
  makeJournal,
  transferDocument
} from './api';
import {
  makeDocument,
  makeOrganization,
  person,
  makeSnapshot
} from './fixtures';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiGetWithRange: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn()
}));

let documents;
let deleted;
let pending;
let proposed;
let organization;
let snapshot;

const audit = () => auditOrganization(42, { snapshot });

beforeEach(() => {
  vi.resetAllMocks();
  snapshot = makeSnapshot();
  documents = [makeDocument()];
  deleted = [];
  pending = [];
  proposed = null;
  organization = makeOrganization({ authoredCount: 1 });
  apiGet.mockImplementation(async url => {
    if (url.includes('/organizations/')) return organization;
    if (url.includes('requireUpdate=true')) return proposed;
    return documents.find(doc =>
      new URL(url, 'https://example.test').pathname.endsWith(`/${doc.id}`)
    );
  });
  apiGetWithRange.mockImplementation(async url => {
    const rows = url.includes('isDeleted=true') ? deleted : pending;
    const skip = Number(new URL(url).searchParams.get('skip') ?? 0);
    return {
      data: { documents: rows.slice(skip, skip + 100) },
      contentRange: rows.length
        ? `documents ${skip}-${Math.min(skip + 99, rows.length - 1)}/${rows.length}`
        : null
    };
  });
  apiPost.mockImplementation(async (_url, body) => {
    const rows = body.filter['library.name'] ? [] : documents;
    return {
      results: rows.slice((body.page - 1) * 100, body.page * 100),
      totalResults: rows.length
    };
  });
  apiPut.mockImplementation(async (_url, { document }) => {
    documents[0] = {
      ...documents[0],
      authors: document.authors.map(id => ({ id })),
      authorsOrganization: document.authorsOrganization.map(id => ({ id }))
    };
  });
});

it.each([
  ['published', { publishedCount: 2 }],
  ['members', { cavers: [{ id: 1 }] }],
  ['explored', { exploredEntrances: [{ id: 1 }] }],
  ['explored', { exploredNetworks: [{ id: 1 }] }],
  ['partners', { partnerEntrances: [{ id: 1 }] }],
  ['partners', { partnerNetworks: [{ id: 1 }] }],
  ['managed', { managedCountries: [{ id: 'FR' }] }],
  ['managed', { managedRegions: [{ id: 'FR-12' }] }],
  ['managed', { managedMassifs: [{ id: 1 }] }],
  ['officialPartner', { isOfficialPartner: true }],
  ['organizationChanged', { type: 'RESEARCH' }],
  ['organizationChanged', { isDeleted: true }]
])('blocks %s before scanning documents', async (key, fields) => {
  organization = makeOrganization(fields);
  expect((await audit()).blockers).toContainEqual({
    key,
    count: fields.publishedCount ?? 1
  });
  expect(apiPost).not.toHaveBeenCalled();
  expect(apiPut).not.toHaveBeenCalled();
});

it('fails closed when counters or relation arrays are unavailable', () => {
  expect(() => getOrganizationBlockers({ id: 42, type: 'OTHER' })).toThrow();
});

it.each(['author', 'editor', 'library'])(
  'blocks a deleted document linked as %s without restoring it',
  async relation => {
    const fields =
      relation === 'author'
        ? {}
        : { authorsOrganization: [], [relation]: { id: 42 } };
    deleted = [makeDocument({ ...fields, isDeleted: true })];
    snapshot = await analyzeGlobalDocuments();
    const result = await audit();
    expect(result.blockers).toContainEqual({ key: 'deleted', count: 1 });
    expect(apiPut).not.toHaveBeenCalled();
    expect(apiPost.mock.calls.every(([url]) => !url.includes('/restore'))).toBe(
      true
    );
  }
);

it('scans all deleted pages and blocks a relation on the last page', async () => {
  deleted = Array.from({ length: 101 }, (_, index) =>
    makeDocument({
      id: index + 1,
      isDeleted: true,
      authorsOrganization: index === 100 ? [{ id: 42 }] : []
    })
  );
  snapshot = await analyzeGlobalDocuments();
  expect((await audit()).blockers).toContainEqual({
    key: 'deleted',
    count: 1
  });
  expect(
    apiGetWithRange.mock.calls.filter(([url]) => url.includes('isDeleted=true'))
  ).toHaveLength(2);
});

it('blocks a pending snapshot even when its current version does not name the organization', async () => {
  pending = [
    makeDocument({
      id: 201,
      authorsOrganization: [],
      validationStatus: 'modificationPending'
    })
  ];
  proposed = makeDocument({ id: 201, validationStatus: 'modificationPending' });
  snapshot = await analyzeGlobalDocuments();
  expect((await audit()).blockers).toContainEqual({
    key: 'pending',
    count: 1
  });
});

it('blocks library holdings after matching the actual organization id', async () => {
  documents[0].library = { id: 42 };
  apiPost.mockResolvedValue({
    results: [makeDocument({ library: { id: 42 } })],
    totalResults: 1
  });
  expect((await audit()).blockers).toContainEqual({
    key: 'library',
    count: 1
  });
});

it('uses full document relations when search omits organization identifiers, as on the live API', async () => {
  apiPost.mockImplementation(async (_url, body) => ({
    results: body.filter['library.name']
      ? []
      : [
          {
            id: '101',
            title: 'A cave survey',
            authors: [],
            authorsOrganization: [{ name: 'Jean Dupont', type: 'OTHER' }]
          }
        ],
    totalResults: body.filter['library.name'] ? 0 : 1
  }));
  const result = await audit();
  expect(result.blockers).toEqual([]);
  expect(result.documents).toEqual(documents);
});

it('checks library IDs on the document detail even when search only returns a name', async () => {
  documents[0].library = { id: 42, name: organization.name };
  apiPost.mockResolvedValue({
    results: [{ id: '101', library: { name: organization.name } }],
    totalResults: 1
  });
  expect((await audit()).blockers).toContainEqual({
    key: 'library',
    count: 1
  });
});

it('ignores similarly named organizations when checking documents', async () => {
  organization.authoredCount = 0;
  documents = [
    makeDocument({ authorsOrganization: [{ id: 99, name: organization.name }] })
  ];
  const result = await audit();
  expect(result.blockers).toEqual([]);
  expect(result.documents).toEqual([]);
});

it('refuses an incomplete search rather than relying on the ten-document preview', async () => {
  organization.authoredCount = 12;
  await expect(audit()).rejects.toMatchObject({
    code: 'organizationConversion.incompleteAudit'
  });
});

it('reads every search page and full document before authorizing a large transfer', async () => {
  documents = Array.from({ length: 101 }, (_, index) =>
    makeDocument({ id: index + 1 })
  );
  organization.authoredCount = documents.length;
  expect((await audit()).documents).toHaveLength(101);
});

it('preserves every coauthor, deduplicates the target and renews the history timestamp', async () => {
  const startedAt = Date.now();
  documents[0].dateReviewed = '2021-11-09T21:47:06.019Z';
  documents[0].authors.push({ id: person.id });
  documents[0].authorsOrganization.push({ id: 99 });
  const journal = makeJournal(organization, person, documents);
  await transferDocument(journal.documents[0]);
  expect(apiPut).toHaveBeenCalledWith(
    expect.stringContaining('/documents/101/new-entities'),
    {
      document: {
        authors: ['7', '8'],
        authorsOrganization: ['99'],
        dateReviewed: expect.any(String)
      }
    }
  );
  const { dateReviewed } = apiPut.mock.calls[0][1].document;
  expect(Date.parse(dateReviewed)).toBeGreaterThanOrEqual(startedAt);
  expect(Date.parse(dateReviewed)).toBeLessThanOrEqual(Date.now());
  // The checkpoint stores relations only: a later retry generates a new date.
  expect(journal.documents[0].after).not.toHaveProperty('dateReviewed');
});

it('retains the failing document and HTTP status without replacing the server error', async () => {
  const error = Object.assign(new Error('An internal server error occurred.'), {
    status: 500
  });
  apiPut.mockRejectedValueOnce(error);
  const entry = makeJournal(organization, person, documents).documents[0];
  await expect(transferDocument(entry)).rejects.toBe(error);
  expect(error).toMatchObject({ documentId: 101, status: 500 });
});

it('reconciles a lost success response without sending the transfer a second time', async () => {
  const journal = makeJournal(organization, person, documents);
  documents[0].authors.push({ id: person.id });
  documents[0].authorsOrganization = [];
  await transferDocument(journal.documents[0]);
  expect(apiPut).not.toHaveBeenCalled();
});

it.each(['coauthor', 'pending', 'deleted'])(
  'stops on a concurrent %s change instead of overwriting it',
  async change => {
    const entry = makeJournal(organization, person, documents).documents[0];
    if (change === 'coauthor') documents[0].authors.push({ id: 999 });
    if (change === 'pending')
      documents[0].validationStatus = 'modificationPending';
    if (change === 'deleted') documents[0].isDeleted = true;
    await expect(transferDocument(entry)).rejects.toMatchObject({
      code: 'organizationConversion.documentChanged'
    });
    expect(apiPut).not.toHaveBeenCalled();
  }
);

it('requires a read confirming the new authors even after an HTTP success', async () => {
  const entry = makeJournal(organization, person, documents).documents[0];
  apiPut.mockResolvedValue({ id: 101 });
  await expect(transferDocument(entry)).rejects.toMatchObject({
    code: 'organizationConversion.documentChanged'
  });
});
