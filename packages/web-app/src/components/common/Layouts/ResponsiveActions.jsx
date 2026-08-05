import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  ButtonGroup,
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

const ResponsiveActions = ({ items }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [anchorEl, setAnchorEl] = useState(null);

  const visibleItems = items?.filter(item => !item.hidden) ?? [];
  if (visibleItems.length === 0) return null;

  const closeMenu = () => setAnchorEl(null);

  const renderButton = ({ key, icon, label, onClick, href, target, color }) => (
    <Tooltip key={key} title={label}>
      <Button
        color={color || 'primary'}
        onClick={onClick}
        {...(href
          ? { component: AppLink, to: href, target, rel: 'noopener noreferrer' }
          : {})}>
        {icon}
      </Button>
    </Tooltip>
  );

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
            <ButtonGroup key={group[0].key} color="primary">
              {group.map(renderButton)}
            </ButtonGroup>
          ))}
      </Box>
    );
  }

  // Built as a flat array rather than with Fragments: MenuList inspects its
  // children to drive keyboard focus, and wrapping items would break that.
  const menuEntries = [];
  visibleItems.forEach((item, index) => {
    if (startsNewGroup(item, visibleItems[index - 1]))
      menuEntries.push(<Divider key={`divider-before-${item.key}`} />);
    const { key, icon, label, onClick, href, target, color } = item;
    const colorSx =
      color === 'secondary' || color === 'success'
        ? { color: `${color}.main` }
        : {};
    menuEntries.push(
      <MenuItem
        key={key}
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
      <ButtonGroup color="primary">
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
      // Sets the item apart from the routine actions (separate ButtonGroup on
      // desktop, divider in the popup menu). For delete and the like.
      destructive: PropTypes.bool
    })
  )
};

export default ResponsiveActions;
