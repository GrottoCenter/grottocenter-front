import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import DatasetIcon from '@mui/icons-material/Dataset';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Translate from '../Translate';
import { persistColumnState } from './tableUtils';

const VisibleColumnsMenu = ({
  columns,
  setColumns,
  entityType,
  label,
  menuTitle = 'Data display',
  icon: Icon = DatasetIcon,
  sx
}) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  const commitColumns = newColumns => {
    setColumns(newColumns);
    persistColumnState(entityType, newColumns);
  };

  const toggleVisibility = column => {
    commitColumns(
      columns.map(c => (c === column ? { ...c, visible: !c.visible } : c))
    );
  };

  const moveColumn = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= columns.length) return;
    const newColumns = [...columns];
    [newColumns[index], newColumns[target]] = [
      newColumns[target],
      newColumns[index]
    ];
    commitColumns(newColumns);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        color="primary"
        startIcon={<Icon fontSize="small" />}
        onClick={event => setAnchorEl(event.currentTarget)}
        sx={{ minWidth: 0, ...sx }}>
        {label && (
          <Box
            component="span"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
            <Translate>{label}</Translate>
          </Box>
        )}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}>
        <MenuItem key="label" disabled>
          {formatMessage({ id: menuTitle })}
        </MenuItem>
        {columns.map((column, index) => (
          <MenuItem
            key={column.field}
            onClick={() => toggleVisibility(column)}
            sx={{ pr: 1 }}>
            <Checkbox
              size="small"
              checked={column.visible}
              onChange={() => {}}
              name={column.field}
            />
            <Box component="span" sx={{ flex: 1, mr: 1 }}>
              <Translate>{column.label}</Translate>
            </Box>
            <Box sx={{ display: 'flex', flexShrink: 0 }}>
              <Tooltip title={formatMessage({ id: 'Move up' })}>
                <span>
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    aria-label={formatMessage({ id: 'Move up' })}
                    onClick={event => {
                      event.stopPropagation();
                      moveColumn(index, -1);
                    }}>
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={formatMessage({ id: 'Move down' })}>
                <span>
                  <IconButton
                    size="small"
                    disabled={index === columns.length - 1}
                    aria-label={formatMessage({ id: 'Move down' })}
                    onClick={event => {
                      event.stopPropagation();
                      moveColumn(index, 1);
                    }}>
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

VisibleColumnsMenu.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setColumns: PropTypes.func.isRequired,
  entityType: PropTypes.string,
  label: PropTypes.string,
  menuTitle: PropTypes.string,
  icon: PropTypes.elementType,
  sx: PropTypes.shape({})
};

export default VisibleColumnsMenu;
