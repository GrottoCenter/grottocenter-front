import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPerson } from '../actions/Person/GetPerson';
import { linkExploredEntrance } from '../actions/Entrance/LinkExploredEntrance';
import { unlinkExploredEntrance } from '../actions/Entrance/UnlinkExploredEntrance';

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
  const [isExplored, setIsExplored] = useState(false);
  const [isExploredLoading, setIsExploredLoading] = useState(false);
  const { person, error: personError } = useSelector(state => state.person);

  // Guard against a stale person from another profile page sharing the reducer.
  const isPersonCurrent = Boolean(userId) && person?.id === userId;

  useEffect(() => {
    if (userId && !isPersonCurrent && !personError) {
      dispatch(fetchPerson(userId));
    }
  }, [userId, isPersonCurrent, personError, dispatch]);

  useEffect(() => {
    if (!entranceId) return;
    if (userId && !isPersonCurrent) return; // wait for the current person's data
    setIsExplored(
      !!person?.exploredEntrances?.some(e => e?.id === entranceId)
    );
  }, [person, entranceId, userId, isPersonCurrent]);

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
      dispatch(fetchPerson(userId));
    } catch (err) {
      console.error('Error toggling explored status:', err);
    } finally {
      setIsExploredLoading(false);
    }
  };

  return { isExplored, isExploredLoading, handleToggleExplored };
};

export { useExplored };
