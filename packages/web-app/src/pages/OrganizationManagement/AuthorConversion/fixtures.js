// Realistic API representations shared by this temporary feature's tests.
export const makeOrganization = (overrides = {}) => ({
  id: 42,
  name: 'Jean Dupont',
  type: 'OTHER',
  isDeleted: false,
  authoredCount: 0,
  publishedCount: 0,
  cavers: [],
  exploredEntrances: [],
  exploredNetworks: [],
  partnerEntrances: [],
  partnerNetworks: [],
  managedCountries: [],
  managedRegions: [],
  managedMassifs: [],
  ...overrides
});

export const makeDocument = (overrides = {}) => ({
  id: 101,
  title: 'A cave survey',
  isDeleted: false,
  validationStatus: 'validated',
  authors: [{ id: 7, nickname: 'Another author', type: 'AUTHOR' }],
  authorsOrganization: [{ id: 42, name: 'Jean Dupont', type: 'OTHER' }],
  editor: null,
  library: null,
  ...overrides
});

export const person = {
  id: 8,
  nickname: 'Jean Dupont',
  type: 'CAVER',
  authoredCount: 15
};

export const makeSnapshot = (overrides = {}) => ({
  version: 1,
  analyzedAt: Date.now(),
  deleted: {},
  pending: {},
  ...overrides
});
