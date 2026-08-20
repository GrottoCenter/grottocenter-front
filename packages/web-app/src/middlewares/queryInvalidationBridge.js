import { getQueryClient } from '../api/queryClientRef';
import { caveKeys, massifKeys } from '../api/queryKeys';

// Bridge from legacy thunks to React Query cache invalidation. Some mutations
// still run as thunks (they carry their own form state, or they touch
// entities that have not all been migrated yet — Description and Guideline
// are shared across cave/entrance/massif). Their success action passes
// through here and invalidates the migrated entity's detail query so the
// consuming page refetches without needing its own subscription.
//
// A thunk that becomes a `useMutation` invalidates in its own `onSuccess`
// and drops out of this file. The bridge shrinks as the migration completes,
// and disappears when the last shared mutation is converted.

const asId = ref => (typeof ref === 'object' && ref !== null ? ref.id : ref);

// getQueryClient() returns null during the store's own module init — the
// bridge only fires on dispatched actions, which happen well after
// conf/queryClient.js has run setQueryClient(). Guarding anyway so a
// reducer test that renders without a client does not crash.
const invalidate = queryKey => {
  const client = getQueryClient();
  if (client) client.invalidateQueries({ queryKey });
};

const invalidateMassif = id => id != null && invalidate(massifKeys.detail(id));

const invalidateCave = id => id != null && invalidate(caveKeys.detail(id));

// Actions carrying `action.massif` (payload updated the massif slice directly).
// `_PERMANENT_SUCCESS` variants share the same payload shape as the plain
// `_SUCCESS`, hence the same handling.
const MASSIF_PAYLOAD_ACTIONS = new Set([
  'UPDATE_MASSIF_SUCCESS',
  'MARK_MASSIF_SENSITIVE_SUCCESS',
  'UNMARK_MASSIF_SENSITIVE_SUCCESS'
]);

// Actions carrying `action.description` whose payload references a massif.
const DESCRIPTION_ACTIONS = new Set([
  'POST_DESCRIPTION_SUCCESS',
  'UPDATE_DESCRIPTION_SUCCESS',
  'DELETE_DESCRIPTION_SUCCESS',
  'DELETE_DESCRIPTION_PERMANENT_SUCCESS',
  'RESTORE_DESCRIPTION_SUCCESS'
]);

// Actions carrying `action.guideline` — guideline has a many-to-many
// relationship with massifs (payload includes `massifs` array).
const GUIDELINE_ACTIONS = new Set([
  'POST_GUIDELINE_SUCCESS',
  'PATCH_GUIDELINE_SUCCESS',
  'DELETE_GUIDELINE_SUCCESS',
  'DELETE_GUIDELINE_PERMANENT_SUCCESS',
  'RESTORE_GUIDELINE_SUCCESS',
  'ROLLBACK_GUIDELINE_SUCCESS'
]);

const queryInvalidationBridge = () => next => action => {
  const result = next(action);

  if (MASSIF_PAYLOAD_ACTIONS.has(action.type)) {
    invalidateMassif(action.massif?.id);
  } else if (DESCRIPTION_ACTIONS.has(action.type)) {
    invalidateMassif(asId(action.description?.massif));
    invalidateCave(asId(action.description?.cave));
  } else if (action.type === 'MOVE_DESCRIPTION_RELEVANCE_SUCCESS') {
    // MoveRelevance swaps two descriptions; either can carry the entity ref.
    invalidateMassif(asId(action.moved?.massif));
    invalidateMassif(asId(action.swapped?.massif));
    invalidateCave(asId(action.moved?.cave));
    invalidateCave(asId(action.swapped?.cave));
  } else if (GUIDELINE_ACTIONS.has(action.type)) {
    (action.guideline?.massifs ?? []).forEach(m => invalidateMassif(asId(m)));
  }

  return result;
};

export default queryInvalidationBridge;
