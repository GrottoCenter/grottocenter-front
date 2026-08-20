import { getQueryClient } from '../api/queryClientRef';
import { entranceKeys, massifKeys } from '../api/queryKeys';

// Bridge from legacy thunks to React Query cache invalidation. Some mutations
// still run as thunks (they carry their own form state, or their action type
// is dispatched by several shared child domains — Description, Location,
// Rigging, Comment, History, Guideline). Their success action passes through
// here and invalidates the migrated entity's detail query so the consuming
// page refetches without needing its own subscription.
//
// A thunk that becomes a `useMutation` invalidates in its own `onSuccess`
// and drops out of this file. The bridge shrinks as the migration completes,
// and disappears when the last shared mutation is converted.

// getQueryClient() returns null during the store's own module init — the
// bridge only fires on dispatched actions, which happen well after
// conf/queryClient.js has run setQueryClient(). Guarding anyway so a
// reducer test that renders without a client does not crash.
const invalidate = queryKey => {
  const client = getQueryClient();
  if (client) client.invalidateQueries({ queryKey });
};

const invalidateMassif = id => id != null && invalidate(massifKeys.detail(id));

// Actions carrying `action.massif` (payload updated the massif slice directly).
// `_PERMANENT_SUCCESS` variants share the same payload shape as the plain
// `_SUCCESS`, hence the same handling.
const MASSIF_PAYLOAD_ACTIONS = new Set([
  'UPDATE_MASSIF_SUCCESS',
  'MARK_MASSIF_SENSITIVE_SUCCESS',
  'UNMARK_MASSIF_SENSITIVE_SUCCESS'
]);

// The Entrance-shape mutations that still live as thunks (form-state).
// UPDATE_ENTRANCE / CREATE_ENTRANCE migrate in A5; this block dies with them.
const ENTRANCE_FORM_ACTIONS = new Set([
  'UPDATE_ENTRANCE_SUCCESS',
  'CREATE_ENTRANCE_SUCCESS'
]);

const queryInvalidationBridge = () => next => action => {
  const result = next(action);

  if (MASSIF_PAYLOAD_ACTIONS.has(action.type)) {
    invalidateMassif(action.massif?.id);
  } else if (ENTRANCE_FORM_ACTIONS.has(action.type)) {
    invalidate(entranceKeys.all);
  }

  return result;
};

export default queryInvalidationBridge;
