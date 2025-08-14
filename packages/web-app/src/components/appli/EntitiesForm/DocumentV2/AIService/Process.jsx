import React from 'react';
import propTypes from 'prop-types';

import { Box, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, Cancel, AccessTime } from '@mui/icons-material';

const Process = ({ name, state }) => {
  const getStatusConfig = () => {
    switch (state) {
      case 'pending':
        return {
          icon: <CircularProgress size={22} thickness={5} />,
          borderColor: 'primary.main',
          textColor: 'primary.main',
          bg: '#ffffff'
        };
      case 'success':
        return {
          icon: <CheckCircle color="success" sx={{ fontSize: 30 }} />,
          borderColor: 'success.light',
          textColor: 'success.main',
          bg: '#ffffff'
        };
      case 'error':
        return {
          icon: <Cancel color="error" sx={{ fontSize: 30 }} />,
          borderColor: 'error.light',
          textColor: 'error.main',
          bg: '#ffffff'
        };
      default:
        return {
          icon: <AccessTime sx={{ fontSize: 30, color: 'text.secondary' }} />,
          borderColor: 'grey.300',
          textColor: 'text.secondary',
          bg: '#ffffff'
        };
    }
  };

  const cfg = getStatusConfig();

  const stateLabel = (() => {
    switch (state) {
      case 'idle':
        return 'En attente';
      case 'pending':
        return 'En cours...';
      case 'success':
        return 'Terminé';
      case 'error':
        return 'Échec';
      default:
        return state;
    }
  })();

  return (
    <Box
      role="status"
      aria-label={`${name} - ${state}`}
      sx={{
        width: '100%',
        backgroundColor: cfg.bg,
        border: '1px solid',
        borderColor: cfg.borderColor,
        borderRadius: 2,
        px: 3,
        py: 2.5,
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: 1,
        transition: 'border-color .25s, box-shadow .25s',
        '&:hover': {
          boxShadow: 3
        }
      }}>
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            state === 'idle'
              ? 'linear-gradient(135deg,#f5f5f5,#fafafa)'
              : 'linear-gradient(135deg,#ffffff,#f5f5f5)',
          flexShrink: 0,
          border: '1px solid',
          borderColor: cfg.borderColor
        }}>
        {cfg.icon}
      </Box>
      <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: cfg.textColor, letterSpacing: '.3px' }}>
          {name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
          {stateLabel}
        </Typography>
      </Box>
    </Box>
  );
};

Process.propTypes = {
  name: propTypes.string.isRequired,
  state: propTypes.oneOf(['idle', 'pending', 'success', 'error']).isRequired
};

export default Process;
