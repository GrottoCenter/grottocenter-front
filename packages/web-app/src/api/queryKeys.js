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
  detail: detailKey('document')
};

export const massifKeys = {
  all: ['massif'],
  detail: detailKey('massif')
};
