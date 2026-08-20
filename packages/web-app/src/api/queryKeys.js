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
