import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  ClickAwayListener,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Tooltip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppLink from '../AppLink';

const ResponsiveActions = ({
  items,
  loading = false,
  loadingLabel,
  size
}) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [anchorEl, setAnchorEl] = useState(null);

  // A pending action is a state of the whole group, not one more item alongside
  // Edit/Delete: rendering it inline in `items` would let it be tabbed to and
  // clicked (an empty onClick). We short-circuit here so the group collapses to
  // a single non-interactive spinner that keeps the geometry stable.
  if (loading) {
    return (
      <ButtonGroup color="primary" size={size}>
        <Button disabled aria-busy="true" aria-label={loadingLabel}>
          <CircularProgress size={20} />
        </Button>
      </ButtonGroup>
    );
  }

  const visibleItems = items?.filter(item => !item.hidden) ?? [];
  if (visibleItems.length === 0) return null;

  const closeMenu = () => setAnchorEl(null);

  const renderButton = ({
    key,
    icon,
    label,
    onClick,
    href,
    target,
    color,
    disabled,
    busy,
    destructive
  }) => {
    const button = (
      <Button
        color={color || (destructive ? 'error' : 'primary')}
        onClick={onClick}
        disabled={disabled}
        aria-busy={busy ? 'true' : undefined}
        aria-label={label}
        {...(href
          ? { component: AppLink, to: href, target, rel: 'noopener noreferrer' }
          : {})}>
        {icon}
      </Button>
    );
    // A disabled <button> emits no hover events, so the Tooltip needs a live
    // element to bind to. Blank the title in that case rather than wrapping
    // every button in a span (MUI warns otherwise for the whole grid).
    return (
      <Tooltip key={key} title={disabled ? '' : label}>
        {button}
      </Tooltip>
    );
  };

  // An item marked `destructive` is set apart from the routine actions, so the
  // trash never sits one pixel from "print" or "page history". Handled here
  // rather than by each caller inserting a separator: six pages build their own
  // items array, and a rule that has to be repeated six times is a rule that
  // gets forgotten.
  const startsNewGroup = (item, previous) =>
    Boolean(previous) &&
    Boolean(previous.destructive) !== Boolean(item.destructive);

  if (isDesktop) {
    // Grouping runs on visibleItems, so a group's first item is a rendered one
    // and its key is stable — never a hidden item that would silently move.
    const groups = [[]];
    visibleItems.forEach((item, index) => {
      if (startsNewGroup(item, visibleItems[index - 1])) groups.push([]);
      groups[groups.length - 1].push(item);
    });

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {groups
          .filter(group => group.length > 0)
          .map(group => (
            <ButtonGroup
              key={group[0].key}
              size={size}
              color={group[0].destructive ? 'error' : 'primary'}>
              {group.map(renderButton)}
            </ButtonGroup>
          ))}
      </Box>
    );
  }

  // One visible action doesn't warrant a burger — a menu with a single entry
  // costs an extra tap for no navigation payoff. Render it inline exactly like
  // desktop does.
  if (visibleItems.length === 1) {
    return (
      <ButtonGroup color="primary" size={size}>
        {renderButton(visibleItems[0])}
      </ButtonGroup>
    );
  }

  // Built as a flat array rather than with Fragments: MenuList inspects its
  // children to drive keyboard focus, and wrapping items would break that.
  const menuEntries = [];
  visibleItems.forEach((item, index) => {
    if (startsNewGroup(item, visibleItems[index - 1]))
      menuEntries.push(<Divider key={`divider-before-${item.key}`} />);
    const {
      key,
      icon,
      label,
      onClick,
      href,
      target,
      color,
      disabled,
      busy,
      destructive
    } = item;
    const effectiveColor = color || (destructive ? 'error' : undefined);
    const colorSx =
      effectiveColor === 'secondary' ||
      effectiveColor === 'success' ||
      effectiveColor === 'error'
        ? { color: `${effectiveColor}.main` }
        : {};
    menuEntries.push(
      <MenuItem
        key={key}
        disabled={disabled}
        aria-busy={busy ? 'true' : undefined}
        onClick={() => {
          onClick?.();
          closeMenu();
        }}
        sx={colorSx}
        {...(href
          ? {
              component: AppLink,
              to: href,
              target,
              rel: 'noopener noreferrer'
            }
          : {})}>
        <ListItemIcon sx={colorSx}>{icon}</ListItemIcon>
        <ListItemText>{label}</ListItemText>
      </MenuItem>
    );
  });

  return (
    <>
      <ButtonGroup color="primary" size={size}>
        <Button
          aria-label="actions"
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl)}
          onClick={e => setAnchorEl(anchorEl ? null : e.currentTarget)}>
          <MoreVertIcon />
        </Button>
      </ButtonGroup>
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        placement="bottom-end"
        sx={{ zIndex: theme.zIndex.tooltip }}>
        <Paper elevation={3}>
          <ClickAwayListener onClickAway={closeMenu}>
            <MenuList
              autoFocusItem={Boolean(anchorEl)}
              onKeyDown={e => {
                if (e.key === 'Escape') closeMenu();
              }}>
              {menuEntries}
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </>
  );
};

ResponsiveActions.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      icon: PropTypes.node,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      href: PropTypes.string,
      target: PropTypes.string,
      color: PropTypes.string,
      hidden: PropTypes.bool,
      // Non-interactive: the item is visible but cannot be triggered. Use for
      // per-item pending states (e.g. a row-scoped reorder that is mid-flight
      // while other actions in the same group stay live).
      disabled: PropTypes.bool,
      // Announces the item as in-progress to assistive tech. Independent of
      // `disabled` — a request can be pending without the button being
      // disabled, or the button can be disabled for reasons unrelated to
      // loading (permissions, offline).
      busy: PropTypes.bool,
      // Sets the item apart from the routine actions (separate ButtonGroup on
      // desktop, divider in the popup menu). For delete and the like.
      destructive: PropTypes.bool
    })
  ),
  // Whole-group pending state. Short-circuits `items` and renders a single
  // non-interactive spinner button, keeping the geometry stable while the
  // caller has nothing yet to offer.
  loading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  // MUI ButtonGroup size. Default (medium) suits page-header actions where the
  // group is the primary affordance. Section-item usages (see ActionButtons)
  // pass `small` so a row of icon-only buttons doesn't outweigh the section
  // header's own create button.
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default ResponsiveActions;
