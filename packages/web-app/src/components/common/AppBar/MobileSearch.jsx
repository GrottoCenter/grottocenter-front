import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import QuickSearch from '../../appli/QuickSearch';
import { APP_BAR_ICON_SIZE } from './constants';

/**
 * The compact half of the quick search — everything below `md`, phones and
 * portrait tablets alike: a magnifier in the AppBar that opens a search view
 * taking over the whole bar.
 *
 * On a 360px phone the bar has ~130px left between the burger and the action
 * icons: enough to *show* a field, not to type in one. So this follows the
 * Material search bar → search view transition, and the collapsed half is an
 * icon rather than a miniature field. A field there would advertise the feature
 * better, but it costs one tap either way and spends the bar's scarcest space
 * to truncate its own placeholder — the magnifier says the same thing in 48px.
 *
 * Two exports rather than one component with an `isOpen` prop: search mode
 * replaces the *whole* toolbar, burger and action icons included, so the state
 * has to live in the AppBar either way.
 */

export const MobileSearchTrigger = ({ onClick }) => {
  const { formatMessage } = useIntl();

  return (
    <IconButton
      color="inherit"
      aria-label={formatMessage({ id: 'Search' })}
      onClick={onClick}
      size="large">
      <SearchIcon sx={{ fontSize: APP_BAR_ICON_SIZE }} />
    </IconButton>
  );
};

MobileSearchTrigger.propTypes = {
  onClick: PropTypes.func.isRequired
};

// A layer over the toolbar rather than a replacement for its content: swapping
// the content out unmounts the action icons with it, and two of them refetch on
// mount (unread messages, unread notifications) and show a spinner in their
// badge while they do — so every trip through the search flickered the bar and
// fired two requests. Covering leaves them mounted and untouched.
//
// Its own gutters, matching the Toolbar's, since `inset: 0` covers those too.
// That is what puts the back arrow's `edge="start"` exactly where the burger is
// underneath it.
// Same trick MUI plays on its own listbox: a control inside search mode must
// not steal focus from the field, or the focus-out dismissal fires on the way
// to it.
const keepFocusInSearch = event => event.preventDefault();

const SearchViewRoot = styled('div')(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  // Above `.MuiBadge-badge`, which MUI pins at `z-index: 1` to clear the ripple.
  // Without this the covered icons hide but their badges keep painting through,
  // since a positioned `z-index: 1` beats every `z-index: auto` sibling whatever
  // the DOM order.
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  [theme.breakpoints.up('sm')]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3)
  }
}));

export const MobileSearchView = ({ onClose }) => {
  const { formatMessage } = useIntl();

  // Two-step Escape, and deliberately so: the Autocomplete calls
  // `stopPropagation` on the native event while its result list is open, so the
  // first press only dismisses the list and the second one — which does reach
  // this listener — leaves search mode.
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Dismiss on click away, the way every expanding search field does.
  //
  // Focus, not a click-away listener: the result panel is portalled out of this
  // subtree, so a `contains(event.target)` test would read a click on a result
  // as a click outside and unmount the list before it could be selected. Focus
  // has no such blind spot — MUI's listbox preventDefaults its own mousedown
  // precisely to keep the input focused, so picking a result never fires this,
  // while a tap anywhere else does.
  //
  // `onBlur` is React's name for `focusout`, which bubbles — hence the root.
  const handleFocusOut = event => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    onClose();
  };

  return (
    <SearchViewRoot onBlur={handleFocusOut}>
      {/* Over the burger, so leaving search mode costs no aiming — which is
          also why the mousedown must not blur: the focus-out would close the
          layer while the finger is still down, and the click that follows would
          land on the burger now exposed underneath and open the drawer. */}
      <IconButton
        color="inherit"
        aria-label={formatMessage({ id: 'Close' })}
        edge="start"
        onMouseDown={keepFocusInSearch}
        onClick={onClose}
        size="large">
        <ArrowBackIcon sx={{ fontSize: APP_BAR_ICON_SIZE }} />
      </IconButton>
      <Box sx={{ flexGrow: 1, minWidth: 0, ml: 0.5 }}>
        {/* `onClose` fires after a result is picked, so navigating also gives
            the bar back instead of leaving it stuck in search mode. */}
        <QuickSearch autoFocus hasFullWidthResults onClose={onClose} />
      </Box>
    </SearchViewRoot>
  );
};

MobileSearchView.propTypes = {
  onClose: PropTypes.func.isRequired
};
