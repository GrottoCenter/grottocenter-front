import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { linkExploredEntrance } from '../actions/Entrance/LinkExploredEntrance';
import { unlinkExploredEntrance } from '../actions/Entrance/UnlinkExploredEntrance';
import { personKeys } from '../api/queryKeys';
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
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [isExplored, setIsExplored] = useState(false);
  const [isExploredLoading, setIsExploredLoading] = useState(false);
  const { data: person } = usePerson(userId);

  useEffect(() => {
    if (!entranceId) return;
    setIsExplored(!!person?.exploredEntrances?.some(e => e?.id === entranceId));
  }, [person, entranceId]);

  const handleToggleExplored = async () => {
    if (!userId || !entranceId) return;
    setIsExploredLoading(true);
    try {
      if (isExplored) {
        await dispatch(unlinkExploredEntrance(entranceId, userId));
      } else {
        await dispatch(linkExploredEntrance(entranceId, userId));
      }
      setIsExplored(prev => !prev);
      queryClient.invalidateQueries({ queryKey: personKeys.detail(userId) });
    } catch (err) {
      console.error('Error toggling explored status:', err);
    } finally {
      setIsExploredLoading(false);
    }
  };

  return { isExplored, isExploredLoading, handleToggleExplored };
};

export { useExplored };
