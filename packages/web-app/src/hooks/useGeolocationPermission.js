import { useEffect, useState } from 'react';

// Whether this origin may read the position, WITHOUT asking for it: the
// Permissions API is a pure read of the permission state and never shows a
// prompt. That is what lets the map display the user's dot on arrival when the
// permission is already granted, and — just as importantly — lets the
// geolocation watch know when re-subscribing would pop a dialog.
//
// 'unknown' is deliberately distinct from 'prompt': on a browser without the API
// (Safari < 16, some Android WebViews) query() is missing or rejects for this
// name, and we genuinely cannot tell. The distinction drives an asymmetry that
// both consumers rely on:
//  - anything that could raise a prompt on its own (auto-starting tracking)
//    requires 'granted', so 'unknown' never risks an unsolicited dialog;
//  - anything we merely want to hold back while a dialog could appear (the
//    watch's liveness rebuilds) is blocked on 'prompt'/'denied' only, so
//    'unknown' keeps today's behaviour rather than losing its stall recovery.
const useGeolocationPermission = () => {
  const [state, setState] = useState('unknown');

  useEffect(() => {
    if (!navigator.permissions?.query) return undefined;

    let status = null;
    let cancelled = false;
    const onChange = () => setState(status.state);

    navigator.permissions
      .query({ name: 'geolocation' })
      .then(result => {
        // Unmounted (or the query lost its race) while the promise was pending.
        if (cancelled) return;
        status = result;
        setState(result.state);
        // The user can grant or revoke from the browser's own settings at any
        // time, with nothing on our side to notice it otherwise.
        result.addEventListener('change', onChange);
      })
      // Rejected: the browser doesn't know this permission name. Stay 'unknown'.
      .catch(() => {});

    return () => {
      cancelled = true;
      if (status) status.removeEventListener('change', onChange);
    };
  }, []);

  return state;
};

export default useGeolocationPermission;
