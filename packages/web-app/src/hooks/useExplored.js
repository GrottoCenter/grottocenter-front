import { useState, useEffect } from 'react';
import {
  useLinkExploredEntrance,
  useUnlinkExploredEntrance
} from './mutations/useExploredEntrance';
import { usePerson } from './queries/usePerson';

/**
 * Manages the "explored" toggle state for an entrance.
 *
 * Exploration is tracked per-entrance: a caver explores specific entrances,
 * not abstract cave entities.
 *
 * @param {number|null} entranceId - The entrance ID to check and toggle.
 * @param {number|null} userId     - The current user ID, or null if not logged in.
 */
const useExplored = ({ entranceId, userId }) => {
  const [isExplored, setIsExplored] = useState(false);
  const [isExploredLoading, setIsExploredLoading] = useState(false);
  const { data: person } = usePerson(userId);
  const linkMutation = useLinkExploredEntrance();
  const unlinkMutation = useUnlinkExploredEntrance();

  useEffect(() => {
    if (!entranceId) return;
    setIsExplored(!!person?.exploredEntrances?.some(e => e?.id === entranceId));
  }, [person, entranceId]);

  const handleToggleExplored = async () => {
    if (!userId || !entranceId) return;
    setIsExploredLoading(true);
    try {
      const mutation = isExplored ? unlinkMutation : linkMutation;
      // Both mutations invalidate personKeys.detail(userId) in their
      // onSuccess, so no manual invalidation is needed here.
      await mutation.mutateAsync({ entranceId, caverId: userId });
      setIsExplored(prev => !prev);
    } catch (err) {
      console.error('Error toggling explored status:', err);
    } finally {
      setIsExploredLoading(false);
    }
  };

  return { isExplored, isExploredLoading, handleToggleExplored };
};

export { useExplored };
