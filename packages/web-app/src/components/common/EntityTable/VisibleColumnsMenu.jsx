import { useLayoutEffect, useRef, useState } from 'react';
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
import { writePreference } from './tableUtils';
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
  const moveButtonRefs = useRef(new Map());
  const pendingFocusRef = useRef(null);

  useLayoutEffect(() => {
    if (pendingFocusRef.current) {
      moveButtonRefs.current.get(pendingFocusRef.current)?.focus();
      pendingFocusRef.current = null;
    }
  }, [columns]);

  const handleColumnsChange = nextColumns => {
    setColumns(nextColumns);
    if (!entityType) return;
    writePreference(
      `entityTable_${entityType}_columns`,
      JSON.stringify(
        nextColumns.filter(col => col.visible).map(col => col.field)
      )
    );
    writePreference(
      `entityTable_${entityType}_columnOrder`,
      JSON.stringify(nextColumns.map(col => col.field))
    );
  };

  const handleMove = (index, offset) => {
    const nextColumns = [...columns];
    const [column] = nextColumns.splice(index, 1);
    nextColumns.splice(index + offset, 0, column);
    if (index + offset === 0 || index + offset === columns.length - 1) {
      // At a boundary, keep focus in this row on the enabled reverse action.
      const direction = offset === -1 ? 'down' : 'up';
      pendingFocusRef.current = `${column.field}-${direction}`;
    }
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
                ref={node => {
                  moveButtonRefs.current.set(`${column.field}-up`, node);
                }}
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
                ref={node => {
                  moveButtonRefs.current.set(`${column.field}-down`, node);
                }}
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
