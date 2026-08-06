import {
  SET_SIDEMENU_EXPANDED,
  OPEN_MOBILE_SIDEMENU,
  CLOSE_MOBILE_SIDEMENU,
  SIDEMENU_EXPANDED_STORAGE_KEY
} from '../actions/SideMenu';

// The two states are deliberately separate rather than one `open` boolean.
// They mean different things — "the desktop rail shows its labels" vs "the
// mobile overlay is on screen" — and only the first one is a preference worth
// remembering. Sharing a single flag would restore `true` on a phone and greet
// the user with a backdrop over the page.
const initialState = {
  // Desktop rail: expanded (240px) or mini (57px). Persisted, because it is now
  // a real user preference: the rail never disappears, so there is no way to
  // lose the menu by restoring this.
  isExpanded:
    window.localStorage.getItem(SIDEMENU_EXPANDED_STORAGE_KEY) !== 'false',
  // Mobile overlay. Never persisted, always starts closed.
  isMobileOpen: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SIDEMENU_EXPANDED:
      return { ...state, isExpanded: action.payload };
    case OPEN_MOBILE_SIDEMENU:
      return { ...state, isMobileOpen: true };
    case CLOSE_MOBILE_SIDEMENU:
      return { ...state, isMobileOpen: false };

    default:
      return state;
  }
};

export default reducer;
