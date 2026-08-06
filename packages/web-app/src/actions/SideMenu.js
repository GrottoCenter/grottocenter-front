export const SET_SIDEMENU_EXPANDED = 'SET_SIDEMENU_EXPANDED';
export const OPEN_MOBILE_SIDEMENU = 'OPEN_MOBILE_SIDEMENU';
export const CLOSE_MOBILE_SIDEMENU = 'CLOSE_MOBILE_SIDEMENU';

export const SIDEMENU_EXPANDED_STORAGE_KEY = 'sideMenuExpanded';

// Desktop rail: expanded (labels) vs mini (icons only). Persisting is done here
// rather than at the call site so no caller can forget it, and so the reducer
// stays free of side effects.
export const setSideMenuExpanded = isExpanded => {
  window.localStorage.setItem(
    SIDEMENU_EXPANDED_STORAGE_KEY,
    String(isExpanded)
  );
  return { type: SET_SIDEMENU_EXPANDED, payload: isExpanded };
};

// Mobile overlay visibility. Deliberately not persisted — see the reducer.
export const openMobileSideMenu = () => ({ type: OPEN_MOBILE_SIDEMENU });
export const closeMobileSideMenu = () => ({ type: CLOSE_MOBILE_SIDEMENU });
