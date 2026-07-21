import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Box,
  Divider,
  IconButton,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { ANCHOR_LEGEND } from '@/utils/riggingLegends';

const ARROWS = ['↑', '↓', '←', '→'];

const AnchorToolbar = ({ onInsert }) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <Tooltip title={formatMessage({ id: 'Anchor notation legend' })} placement="top">
        <IconButton
          size="small"
          onMouseDown={e => {
            e.preventDefault();
            setAnchorEl(e.currentTarget);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setAnchorEl(e.currentTarget);
            }
          }}
          aria-label={formatMessage({ id: 'Anchor notation legend' })}
          sx={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: 4,
            zIndex: 1,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' }
          }}>
          <EditNoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Box sx={{ pt: 2, px: 2, pb: 2, minWidth: 200 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {formatMessage({ id: 'Click to insert' })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {ARROWS.map(arrow => (
              <Tooltip key={arrow} title={`${formatMessage({ id: 'Click to insert' })} ${arrow}`}>
                <IconButton
                  onClick={() => {
                    onInsert(arrow);
                    setAnchorEl(null);
                  }}
                  aria-label={arrow}
                  sx={{
                    width: 44,
                    height: 44,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    lineHeight: 1,
                    color: 'text.primary'
                  }}>
                  {arrow}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
          <Divider sx={{ mb: '12px' }} />
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            {formatMessage({ id: 'Anchor notation legend' })}
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Table size="small" sx={{ mb: 0 }}>
            <TableBody>
              {ANCHOR_LEGEND.map(({ abbrevKey, labelKey }) => (
                <TableRow key={abbrevKey}>
                  <TableCell sx={{ border: 0, py: 0.5, pr: 2 }}>
                    <Typography variant="body2" fontWeight="bold" component="span">
                      {formatMessage({ id: abbrevKey })}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 0.5 }}>
                    <Typography variant="body2" component="span">
                      {formatMessage({ id: labelKey })}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Popover>
    </>
  );
};

AnchorToolbar.propTypes = {
  onInsert: PropTypes.func.isRequired
};

export default AnchorToolbar;
