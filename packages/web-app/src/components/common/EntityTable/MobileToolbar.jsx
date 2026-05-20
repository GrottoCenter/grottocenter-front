import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip
} from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewListIcon from '@mui/icons-material/ViewList';
import VisibleColumnsMenu from './VisibleColumnsMenu';
import Translate from '../Translate';

const SortMenu = ({
  sortableColumns,
  order,
  orderBy,
  onSortFieldChange,
  onSortDirToggle
}) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  const activeCol = sortableColumns.find(c => c.field === orderBy);
  const label = activeCol
    ? formatMessage({ id: activeCol.label })
    : formatMessage({ id: 'Sort by' });
  const startIcon =
    orderBy && order === 'desc' ? (
      <ArrowDownwardIcon fontSize="small" />
    ) : orderBy ? (
      <ArrowUpwardIcon fontSize="small" />
    ) : (
      <SwapVertIcon fontSize="small" />
    );

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={startIcon}
        onClick={e => setAnchorEl(e.currentTarget)}
        color="primary"
        sx={{ flex: 1, minWidth: 0 }}>
        <Box
          component="span"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </Box>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}>
        {sortableColumns.map(col => (
          <MenuItem
            key={col.field}
            selected={col.field === orderBy}
            onClick={() => {
              if (col.field === orderBy) {
                onSortDirToggle();
              } else {
                onSortFieldChange({ target: { value: col.field } });
              }
              setAnchorEl(null);
            }}>
            <ListItemIcon>
              {col.field === orderBy &&
                (order === 'desc' ? (
                  <ArrowDownwardIcon fontSize="small" />
                ) : (
                  <ArrowUpwardIcon fontSize="small" />
                ))}
            </ListItemIcon>
            <Translate>{col.label}</Translate>
          </MenuItem>
        ))}
        {orderBy && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                onSortFieldChange({ target: { value: '' } });
                setAnchorEl(null);
              }}>
              <ListItemIcon>
                <CloseIcon fontSize="small" />
              </ListItemIcon>
              <Translate>Clear sort</Translate>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

SortMenu.propTypes = {
  sortableColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  onSortFieldChange: PropTypes.func.isRequired,
  onSortDirToggle: PropTypes.func.isRequired
};

const MobileToolbar = ({
  sortableColumns,
  order,
  orderBy,
  onSortFieldChange,
  onSortDirToggle,
  compact,
  entityColumns,
  setEntityColumns,
  entityType,
  onViewToggle,
  viewMode
}) => {
  const { formatMessage } = useIntl();
  return (
  <Toolbar
    disableGutters
    variant="dense"
    sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 48 }}>
    {sortableColumns.length > 0 && (
      <SortMenu
        sortableColumns={sortableColumns}
        order={order}
        orderBy={orderBy}
        onSortFieldChange={onSortFieldChange}
        onSortDirToggle={onSortDirToggle}
      />
    )}
    {!compact && (
      <VisibleColumnsMenu
        columns={entityColumns}
        setColumns={setEntityColumns}
        entityType={entityType}
        label="Data"
        menuTitle="Data display"
        sx={{ flex: 1 }}
      />
    )}
    <Tooltip title={formatMessage({ id: viewMode === 'cards' ? 'Table view' : 'Card view' })}>
      <IconButton
        size="small"
        onClick={onViewToggle}
        color="primary"
        sx={{
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 1
        }}>
        {viewMode === 'cards' ? (
          <TableChartIcon fontSize="small" />
        ) : (
          <ViewListIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  </Toolbar>
  );
};

MobileToolbar.propTypes = {
  sortableColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  onSortFieldChange: PropTypes.func.isRequired,
  onSortDirToggle: PropTypes.func.isRequired,
  compact: PropTypes.bool.isRequired,
  entityColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setEntityColumns: PropTypes.func.isRequired,
  entityType: PropTypes.string,
  onViewToggle: PropTypes.func.isRequired,
  viewMode: PropTypes.string.isRequired
};

export default MobileToolbar;
