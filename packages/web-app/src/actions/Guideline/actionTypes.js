// Guideline mutation action types.
//
// The mutations themselves migrated to hooks/mutations/useGuideline.js, but
// CountryReducer and RegionDetailsReducer still listen to these action
// types to keep their embedded guidelines in sync — useGuideline's onSuccess
// dispatches them for that purpose (bridge pattern).
//
// This file goes away in Phase B when Country and Region details migrate to
// React Query — the mutation onSuccess stops dispatching and the reducers
// disappear with the slices.

export const POST_GUIDELINE_SUCCESS = 'POST_GUIDELINE_SUCCESS';
export const PATCH_GUIDELINE_SUCCESS = 'PATCH_GUIDELINE_SUCCESS';
export const DELETE_GUIDELINE_SUCCESS = 'DELETE_GUIDELINE_SUCCESS';
export const DELETE_GUIDELINE_PERMANENT_SUCCESS =
  'DELETE_GUIDELINE_PERMANENT_SUCCESS';
export const RESTORE_GUIDELINE_SUCCESS = 'RESTORE_GUIDELINE_SUCCESS';
export const ROLLBACK_GUIDELINE_SUCCESS = 'ROLLBACK_GUIDELINE_SUCCESS';
