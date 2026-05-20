import React from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, MenuItem, Select, Toolbar } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import VisibleColumnsMenu from './VisibleColumnsMenu';
import Translate from '../Translate';

const MobileToolbar = ({
  sortableColumns,
  order,
  orderBy,
  onSortFieldChange,
  onSortDirToggle,
  compact,
  entityColumns,
  setEntityColumns,
  entityType
}) => (
  <Toolbar
    disableGutters
    variant="dense"
    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 48 }}>
    {sortableColumns.length > 0 && (
      <>
        <Select
          size="small"
          value={orderBy}
          onChange={onSortFieldChange}
          displayEmpty
          sx={{ minWidth: 130, fontSize: 'body2.fontSize' }}>
          <MenuItem value="">
            <em>
              <Translate>Sort by</Translate>
            </em>
          </MenuItem>
          {sortableColumns.map(col => (
            <MenuItem key={col.field} value={col.field}>
              <Translate>{col.label}</Translate>
            </MenuItem>
          ))}
        </Select>
        <IconButton size="small" disabled={!orderBy} onClick={onSortDirToggle}>
          {order === 'desc' ? (
            <ArrowDownwardIcon fontSize="small" />
          ) : (
            <ArrowUpwardIcon fontSize="small" />
          )}
        </IconButton>
      </>
    )}
    <Box sx={{ flex: 1 }} />
    {!compact && (
      <VisibleColumnsMenu
        columns={entityColumns}
        setColumns={setEntityColumns}
        entityType={entityType}
      />
    )}
  </Toolbar>
);

MobileToolbar.propTypes = {
  sortableColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  onSortFieldChange: PropTypes.func.isRequired,
  onSortDirToggle: PropTypes.func.isRequired,
  compact: PropTypes.bool.isRequired,
  entityColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setEntityColumns: PropTypes.func.isRequired,
  entityType: PropTypes.string
};

export default MobileToolbar;
