import { useEffect, useRef, useState } from 'react';
import fetch from 'isomorphic-fetch';
import { useSelector } from 'react-redux';

import { getCaveUrl } from '../conf/apiRoutes';

// The entrance endpoint only exposes sibling entrance ids, so when we need the
// name of the *other* entrance of a 2-entrance network (a network that dissolves
// into standalone entrances on detach/move), we fetch the cave — which does carry
// its entrances' names. Returns null until resolved, on error, or when disabled.
export const useOtherEntranceName = (caveId, currentEntranceId, enabled) => {
  const authorizationHeader = useSelector(
    state => state.login.authorizationHeader
  );
  const [name, setName] = useState(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !caveId) {
      setName(null);
      return;
    }
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setName(null);
    fetch(`${getCaveUrl}${caveId}`, { headers: authorizationHeader })
      .then(response => response.json())
      .then(cave => {
        if (requestId !== requestIdRef.current) return;
        const other = (cave.entrances || []).find(
          entry => Number(entry?.id) !== Number(currentEntranceId)
        );
        setName(other?.name ?? null);
      })
      .catch(() => {
        if (requestId === requestIdRef.current) setName(null);
      });
    // Invalidate the in-flight request on unmount so its .then() doesn't
    // setName() on an unmounted component (stale-on-unmount).
    return () => {
      requestIdRef.current += 1;
    };
  }, [caveId, currentEntranceId, enabled, authorizationHeader]);

  return name;
};
