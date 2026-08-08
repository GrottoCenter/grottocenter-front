import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Checkbox, Menu, MenuItem } from '@mui/material';
import DatasetIcon from '@mui/icons-material/Dataset';
import ToolbarActionButton from './ToolbarActionButton';
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
      <ToolbarActionButton
        icon={Icon}
        label={label ? formatMessage({ id: label }) : null}
        // Unlabelled, the menu title is the only thing that can name it.
        tooltip={label ? null : formatMessage({ id: menuTitle })}
        onClick={event => setAnchorEl(event.currentTarget)}
        sx={sx}
      />
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
