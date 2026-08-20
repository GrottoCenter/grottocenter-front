// Query key factories — the single source of truth for cache invalidation.
//
// Keys are built here rather than inlined at the useQuery call site so that a
// mutation can invalidate a whole domain (`caveKeys.all`) or one entity
// (`caveKeys.detail(id)`) without a consumer guessing the array shape. Adding a
// key means adding it here first.
//
// Convention: `all` is the domain prefix, and every other entry extends it, so
// invalidating the prefix invalidates everything below it.

/** Static reference lists — fetched once per session, never invalidated. */
export const referenceKeys = {
  all: ['reference'],
  fileFormats: () => [...referenceKeys.all, 'fileFormats'],
  licenses: () => [...referenceKeys.all, 'licenses'],
  documentTypes: () => [...referenceKeys.all, 'documentTypes'],
  identifierTypes: () => [...referenceKeys.all, 'identifierTypes'],
  subjects: () => [...referenceKeys.all, 'subjects'],
  languages: () => [...referenceKeys.all, 'languages'],
  projections: () => [...referenceKeys.all, 'projections']
};

// Entity keys. Each `detail(id)` key is what a mutation invalidates to force a
// refetch of the parent entity when it (or one of its children — descriptions,
// riggings, locations, …) changes. Options are appended when the same detail
// has to be cached under different shapes (documents with `requireUpdate` fetch
// a snapshot the moderator can act on — different payload, different key).

const detailKey = domain => (id, opts) => {
  const key = [domain, 'detail', id];
  if (opts !== undefined) key.push(opts);
  return key;
};

export const documentKeys = {
  all: ['document'],
  detail: detailKey('document'),
  children: id => [...documentKeys.all, 'children', id],
  list: criteria => [...documentKeys.all, 'list', criteria]
};

export const massifKeys = {
  all: ['massif'],
  detail: detailKey('massif')
};

export const caveKeys = {
  all: ['cave'],
  detail: detailKey('cave')
};

export const entranceKeys = {
  all: ['entrance'],
  detail: detailKey('entrance')
};

export const personKeys = {
  all: ['person'],
  detail: detailKey('person')
};

export const organizationKeys = {
  all: ['organization'],
  detail: detailKey('organization')
};

export const countryKeys = {
  all: ['country'],
  detail: detailKey('country')
};

// Region details are keyed on (countryId, regionId): the API path is
// nested (/countries/:c/regions/:r), and two countries can host the same
// short regionId. detailKey composes them into an array-form id.
export const regionKeys = {
  all: ['region'],
  detail: (countryId, regionId) => ['region', 'detail', countryId, regionId]
};

// Revision history for any versioned entity. Keyed on the parent (typeId,
// typeName) and the two options that switch the endpoint's shape.
export const snapshotKeys = {
  all: ['snapshot'],
  list: (typeId, typeName, opts) => ['snapshot', 'list', typeName, typeId, opts]
};

// Per-user notifications. The unread counter shares the domain so
// invalidating notificationKeys.all after a read refreshes list + menu +
// counter in one call.
export const notificationKeys = {
  all: ['notification'],
  list: opts => ['notification', 'list', opts],
  menu: opts => ['notification', 'menu', opts],
  unreadCount: () => ['notification', 'unreadCount']
};

// Moderator queue counters. Two independent endpoints, one domain root so a
// single invalidateQueries({ queryKey: countKeys.all }) refreshes both after
// a moderator processes an item.
export const countKeys = {
  all: ['count'],
  pendingDocuments: () => ['count', 'pendingDocuments'],
  duplicates: () => ['count', 'duplicates']
};

// Per-user country/region/massif subscriptions. Every subscribe/unsubscribe
// mutation invalidates subscriptionKeys.all so the list refetches without
// hand-written reducer patching.
export const subscriptionKeys = {
  all: ['subscription'],
  list: caverId => ['subscription', 'list', caverId]
};

// Direct messages (private inbox). unreadCount is a sibling of the two lists
// so a mutation that lands a message (send / open a conversation for reading)
// can invalidateQueries({ queryKey: messageKeys.all }) and refresh everything
// with one call.
export const messageKeys = {
  all: ['message'],
  conversations: opts => ['message', 'conversations', opts],
  messages: (conversationId, opts) => [
    'message',
    'messages',
    conversationId,
    opts
  ],
  unreadCount: () => ['message', 'unreadCount']
};

// Moderator DB export + document validation. Everything under this root
// invalidates together — validating documents refreshes the pending count
// and the validation queue in a single call.
export const moderationKeys = {
  all: ['moderation'],
  dbExport: () => ['moderation', 'dbExport']
};

// Async CSV import batch job — polled from useJobStatus with refetchInterval
// until status becomes terminal (completed / failed). Batch ids are never
// reused, so a single detail-style key is enough.
export const importKeys = {
  all: ['import'],
  batch: batchId => ['import', 'batch', batchId]
};

// Homepage / admin content lists — mostly one-shot GETs that back the
// carousels, cards and admin queues. Grouped under a shared root so a global
// "invalidate all admin lists" is a single call.
export const listKeys = {
  all: ['list'],
  recentChanges: () => ['list', 'recentChanges'],
  partnersCarousel: () => ['list', 'partnersCarousel'],
  randomEntrance: () => ['list', 'randomEntrance'],
  latestBlogNews: url => ['list', 'latestBlogNews', url],
  bannedCavers: () => ['list', 'bannedCavers'],
  invalidEmailCavers: () => ['list', 'invalidEmailCavers'],
  groups: () => ['list', 'groups']
};

// Cross-entity full-text + faceted search backing the /search page and the
// SearchDocumentForm/SearchOrganizationForm/SearchCaveForm dialogs. Only one
// search is active app-wide at a time (matches the pre-migration global
// reducer state), so `results(params)` is the only key.
export const advancedSearchKeys = {
  all: ['advancedSearch'],
  results: params => ['advancedSearch', 'results', params]
};

// Homepage aggregate counters + per-entity statistics blocks. All are
// long-cache-friendly aggregate reads.
export const statsKeys = {
  all: ['stats'],
  dynamicNumber: type => ['stats', 'dynamicNumber', type],
  cumulatedLength: () => ['stats', 'cumulatedLength'],
  country: countryId => ['stats', 'country', countryId],
  region: (countryId, regionId) => ['stats', 'region', countryId, regionId],
  massif: massifId => ['stats', 'massif', massifId]
};
