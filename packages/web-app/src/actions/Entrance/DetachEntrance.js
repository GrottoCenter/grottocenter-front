import fetch from 'isomorphic-fetch';
import {
  postCreateCaveUrl,
  moveEntranceToCaveUrl,
  deleteCaveUrl
} from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const DETACH_ENTRANCE = 'DETACH_ENTRANCE';
export const DETACH_ENTRANCE_SUCCESS = 'DETACH_ENTRANCE_SUCCESS';
export const DETACH_ENTRANCE_FAILURE = 'DETACH_ENTRANCE_FAILURE';
export const DETACH_ENTRANCE_RESET = 'DETACH_ENTRANCE_RESET';

export const detachEntranceAction = () => ({
  type: DETACH_ENTRANCE
});

export const detachEntranceSuccess = () => ({
  type: DETACH_ENTRANCE_SUCCESS
});

export const detachEntranceFailure = error => ({
  type: DETACH_ENTRANCE_FAILURE,
  error
});

export const resetDetachEntrance = () => ({
  type: DETACH_ENTRANCE_RESET
});

export const detachEntranceToNewCave = entrance => async (
  dispatch,
  getState
) => {
  dispatch(detachEntranceAction());

  const { authorizationHeader } = getState().login;

  try {
    // Step 1: Create a new cave with the entrance's name and language
    const createCaveResponse = await fetch(postCreateCaveUrl, {
      method: 'POST',
      body: JSON.stringify({
        name: { text: entrance.name, language: entrance.language }
      }),
      headers: authorizationHeader
    }).then(checkAuthStatus(dispatch));

    const newCave = await createCaveResponse.json();

    // Step 2: Move the entrance to the newly created cave
    try {
      await fetch(moveEntranceToCaveUrl(entrance.id, newCave.id), {
        method: 'PATCH',
        headers: authorizationHeader
      }).then(checkAuthStatus(dispatch));

      dispatch(detachEntranceSuccess());
    } catch (moveError) {
      if (moveError.isAuthError) return;

      // Rollback: delete the created cave (best-effort, no checkAuthStatus
      // since the token may have expired and we don't want to trigger logout
      // during error handling)
      try {
        await fetch(deleteCaveUrl(newCave.id, {}), {
          method: 'DELETE',
          headers: authorizationHeader
        });
      } catch {
        // Swallow rollback error silently
      }

      dispatch(detachEntranceFailure(moveError.message || 'Move failed'));
    }
  } catch (error) {
    if (error.isAuthError) return;
    dispatch(detachEntranceFailure(error.message || 'Cave creation failed'));
  }
};
