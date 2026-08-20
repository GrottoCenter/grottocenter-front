import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  accountUrl,
  banCaverUrl,
  unbanCaverUrl,
  moveEntranceToCaveUrl,
  postCreateCaveUrl,
  deleteCaveUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPatch, apiDelete } from '../../api/client';
import {
  caveKeys,
  entranceKeys,
  listKeys,
  personKeys
} from '../../api/queryKeys';

// Ban / unban / moveEntrance are body-less side-effects. Passing undefined
// skips the JSON header (see send() in api/client.js), matching what these
// endpoints expect.
const emptyPost = url => apiPost(url, undefined);
const emptyPatch = url => apiPatch(url, undefined);

// Ban / unban a caver. Both invalidate the person detail (so an open profile
// picks up the new isBanned state) and the banned-cavers list on the admin
// dashboard.
export const useBanCaver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: caverId => emptyPost(banCaverUrl(caverId)),
    onSuccess: (_data, caverId) => {
      queryClient.invalidateQueries({
        queryKey: personKeys.detail(caverId)
      });
      queryClient.invalidateQueries({ queryKey: listKeys.bannedCavers() });
    }
  });
};

export const useUnbanCaver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: caverId => emptyPost(unbanCaverUrl(caverId)),
    onSuccess: (_data, caverId) => {
      queryClient.invalidateQueries({
        queryKey: personKeys.detail(caverId)
      });
      queryClient.invalidateQueries({ queryKey: listKeys.bannedCavers() });
    }
  });
};

// Self-service account update. The Redux `account` slice stays (see anti-scope
// in the roadmap ADR) — callers dispatch fetchAccount after mutateAsync so the
// side-panel re-reads a fresh account. `mutateAsync` also propagates the thrown
// error, which callers translate (nickname 409 conflict, etc.).
export const useUpdateAccount = () =>
  useMutation({
    mutationFn: fields => apiPatch(accountUrl, fields)
  });

// Attach an entrance to an existing cave (either another network or a solo
// cave). Both the entrance (parent cave changed) and both caves (member set
// changed) need a refetch.
export const useMoveEntranceToCave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entranceId, caveId }) =>
      emptyPatch(moveEntranceToCaveUrl(entranceId, caveId)),
    onSuccess: (_data, { entranceId }) => {
      queryClient.invalidateQueries({
        queryKey: entranceKeys.detail(entranceId)
      });
      queryClient.invalidateQueries({ queryKey: caveKeys.all });
    }
  });
};

// Detach an entrance from its current cave by creating a new solo cave and
// re-parenting the entrance. Two-step: if the move fails, the just-created
// cave is deleted so we don't leave orphan caves in the DB. The rollback is
// best-effort — the original thunk logged its rollback failure silently, and
// preserving that avoids surfacing a rollback error on top of the main one.
export const useDetachEntranceToNewCave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async entrance => {
      const newCave = await apiPost(postCreateCaveUrl, {
        name: { text: entrance.name, language: entrance.language }
      });
      try {
        return await emptyPatch(moveEntranceToCaveUrl(entrance.id, newCave.id));
      } catch (moveError) {
        // Best-effort rollback; swallow any rollback error.
        try {
          await apiDelete(deleteCaveUrl(newCave.id, {}));
        } catch {
          /* rollback failure is intentionally silent */
        }
        throw moveError;
      }
    },
    onSuccess: (_data, entrance) => {
      queryClient.invalidateQueries({
        queryKey: entranceKeys.detail(entrance.id)
      });
      queryClient.invalidateQueries({ queryKey: caveKeys.all });
    }
  });
};
