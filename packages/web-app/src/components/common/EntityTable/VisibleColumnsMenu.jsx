import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Popover,
  Typography
} from '@mui/material';
import DatasetIcon from '@mui/icons-material/Dataset';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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

  const handleColumnsChange = nextColumns => {
    setColumns(nextColumns);
    if (!entityType) return;
    try {
      localStorage.setItem(
        `entityTable_${entityType}_columns`,
        JSON.stringify(
          nextColumns.filter(col => col.visible).map(col => col.field)
        )
      );
      localStorage.setItem(
        `entityTable_${entityType}_columnOrder`,
        JSON.stringify(nextColumns.map(col => col.field))
      );
    } catch {
      // Preferences are optional: blocked/full storage must not break controls.
    }
  };

  const handleMove = (index, offset) => {
    const nextColumns = [...columns];
    const [column] = nextColumns.splice(index, 1);
    nextColumns.splice(index + offset, 0, column);
    handleColumnsChange(nextColumns);
  };

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
      <Popover
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'min(65vh, 560px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }
          }
        }}>
        <Typography
          sx={{ px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}
          variant="subtitle2">
          {formatMessage({ id: menuTitle })}
        </Typography>
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 1,
            minHeight: 0,
            overflowY: 'auto'
          }}
          aria-label={formatMessage({ id: menuTitle })}>
          {columns.map((column, index) => (
            <Box
              component="li"
              key={column.field}
              data-testid={`column-option-${column.field}`}
              sx={{ display: 'flex', alignItems: 'center', minHeight: 44 }}>
              <FormControlLabel
                sx={{ m: 0, flex: 1, minWidth: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={column.visible}
                    onChange={() =>
                      handleColumnsChange(
                        columns.map(c =>
                          c === column ? { ...c, visible: !c.visible } : c
                        )
                      )
                    }
                    name={column.field}
                  />
                }
                label={<Translate>{column.label}</Translate>}
              />
              <IconButton
                size="small"
                disabled={index === 0}
                sx={{ width: 44, height: 44 }}
                data-testid={`move-column-${column.field}-up`}
                aria-label={formatMessage(
                  { id: 'tableColumns.moveUp' },
                  {
                    column: formatMessage({ id: column.label })
                  }
                )}
                onClick={() => handleMove(index, -1)}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                disabled={index === columns.length - 1}
                sx={{ width: 44, height: 44 }}
                data-testid={`move-column-${column.field}-down`}
                aria-label={formatMessage(
                  { id: 'tableColumns.moveDown' },
                  {
                    column: formatMessage({ id: column.label })
                  }
                )}
                onClick={() => handleMove(index, 1)}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
};

VisibleColumnsMenu.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      visible: PropTypes.bool.isRequired
    })
  ).isRequired,
  setColumns: PropTypes.func.isRequired,
  entityType: PropTypes.string,
  label: PropTypes.string,
  menuTitle: PropTypes.string,
  icon: PropTypes.elementType,
  sx: PropTypes.shape({})
};

export default VisibleColumnsMenu;
