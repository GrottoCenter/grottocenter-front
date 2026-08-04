import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, Checkbox, Menu, MenuItem } from '@mui/material';
import DatasetIcon from '@mui/icons-material/Dataset';
import Translate from '../Translate';

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
  entityType: PropTypes.string,
  label: PropTypes.string,
  menuTitle: PropTypes.string,
  icon: PropTypes.elementType,
  sx: PropTypes.shape({})
};

export default VisibleColumnsMenu;
