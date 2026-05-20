import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
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
import { Link } from 'react-router-dom';

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
        {...(href ? { component: Link, to: href, target, rel: 'noopener noreferrer' } : {})}>
        {icon}
      </Button>
    </Tooltip>
  );

  if (isDesktop) {
    return (
      <ButtonGroup color="primary">
        {visibleItems.map(renderButton)}
      </ButtonGroup>
    );
  }

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
              {visibleItems.map((item, index) => {
                if (item.divider) return <Divider key={`d-${index}`} />;
                const { key, icon, label, onClick, href, target, color } = item;
                const colorSx =
                  color === 'secondary' ? { color: 'secondary.main' } : {};
                return (
                  <MenuItem
                    key={key}
                    onClick={() => {
                      onClick?.();
                      closeMenu();
                    }}
                    sx={colorSx}
                    {...(href
                      ? { component: Link, to: href, target, rel: 'noopener noreferrer' }
                      : {})}>
                    <ListItemIcon sx={colorSx}>{icon}</ListItemIcon>
                    <ListItemText>{label}</ListItemText>
                  </MenuItem>
                );
              })}
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
      divider: PropTypes.bool
    })
  )
};

export default ResponsiveActions;
