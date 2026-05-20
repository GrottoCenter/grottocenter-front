import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Checkbox, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import Translate from '../Translate';

const VisibleColumnsMenu = ({ columns, setColumns, entityType }) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <>
      <Tooltip title={formatMessage({ id: 'Change columns' })}>
        <IconButton
          color="primary"
          onClick={event => setAnchorEl(event.currentTarget)}>
          <ViewColumnIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}>
        <MenuItem key="label" disabled>
          {formatMessage({ id: 'Change columns' })}
        </MenuItem>
        {columns.map(column => (
          <MenuItem
            key={column.field}
            onClick={() => {
              const newColumns = columns.map(c =>
                c === column ? { ...c, visible: !c.visible } : c
              );
              setColumns(newColumns);
              if (entityType) {
                const storageKey = `entityTable_${entityType}_columns`;
                const visibleFields = newColumns
                  .filter(col => col.visible)
                  .map(col => col.field);
                localStorage.setItem(storageKey, JSON.stringify(visibleFields));
              }
            }}>
            <Checkbox
              size="small"
              checked={column.visible}
              onChange={() => {}}
              name={column.field}
            />
            <Translate>{column.label}</Translate>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

VisibleColumnsMenu.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setColumns: PropTypes.func.isRequired,
  entityType: PropTypes.string
};

export default VisibleColumnsMenu;
