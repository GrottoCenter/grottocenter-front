import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Box,
  IconButton,
  Popover,
  Tooltip,
  Typography
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';

const ARROWS = ['↑', '↓', '←', '→'];

const AnchorToolbar = ({ onInsert }) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <Tooltip title={formatMessage({ id: 'Insert a symbol' })} placement="top">
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
          aria-label={formatMessage({ id: 'Insert a symbol' })}
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
        <Box sx={{ pt: 1, px: 1, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {formatMessage({ id: 'Click to insert' })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
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
        </Box>
      </Popover>
    </>
  );
};

AnchorToolbar.propTypes = {
  onInsert: PropTypes.func.isRequired
};

export default AnchorToolbar;
