import { isMobileOnly } from 'react-device-detect';
import {
  TOGGLE_SIDEMENU,
  OPEN_SIDEMENU,
  CLOSE_SIDEMENU
} from '../actions/SideMenu';

const initialState = {
  open: !isMobileOnly
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case TOGGLE_SIDEMENU:
      return { ...state, open: !state.open };
    case OPEN_SIDEMENU:
      return { ...state, open: true };
    case CLOSE_SIDEMENU:
      return { ...state, open: false };

    default:
      return state;
  }
};

export default reducer;
