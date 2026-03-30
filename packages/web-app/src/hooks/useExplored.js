import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPerson } from '../actions/Person/GetPerson';
import { linkCave } from '../actions/Cave/LinkCave';
import { unlinkCave } from '../actions/Cave/UnlinkCave';

/**
 * Manages the "explored" toggle state for a cave/network.
 *
 * @param {number|null} caveId    - The cave ID to check and toggle.
 * @param {number|null} entranceId - Optional entrance ID for additional check (entrance page only).
 * @param {number|null} userId    - The current user ID, or null if not logged in.
 */
const useExplored = ({ caveId, entranceId = null, userId }) => {
  const dispatch = useDispatch();
  const [isExplored, setIsExplored] = useState(false);
  const [isExploredLoading, setIsExploredLoading] = useState(false);
  const { person, error: personError } = useSelector(state => state.person);

  useEffect(() => {
    if (userId && !person && !personError) {
      dispatch(fetchPerson(userId));
    }
  }, [userId, person, personError, dispatch]);

  useEffect(() => {
    if (!caveId) return;
    if (userId && !person) return; // wait for person data before setting explored state
    const inNetworks = person?.exploredNetworks?.some(n => n?.id === caveId);
    const inEntrances = entranceId
      ? person?.exploredEntrances?.some(e => e?.id === entranceId)
      : false;
    setIsExplored(!!(inNetworks || inEntrances));
  }, [person, caveId, entranceId, userId]);

  const handleToggleExplored = async () => {
    if (!userId || !caveId) return;
    setIsExploredLoading(true);
    try {
      if (isExplored) {
        await dispatch(unlinkCave(caveId, userId, false));
      } else {
        await dispatch(linkCave(caveId, userId, false));
      }
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
