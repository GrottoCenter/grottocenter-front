import React from 'react';

import React from 'react';
import { Box, Typography, CircularProgress, Chip } from '@mui/material';
import { CheckCircle, Cancel, AccessTime } from '@mui/icons-material';

const Process = ({
    name,
    state, // 'pending', 'success', 'error'
}) => {
    
    const getStatusConfig = () => {
        switch (state) {
            case 'pending':
                return {
                    icon: <CircularProgress size={16} />,
                    color: 'primary',
                    bgColor: 'primary.light',
                    textColor: 'primary.dark'
                };
            case 'success':
                return {
                    icon: <CheckCircle sx={{ fontSize: 16 }} />,
                    color: 'success',
                    bgColor: 'success.light',
                    textColor: 'success.dark'
                };
            case 'error':
                return {
                    icon: <Cancel sx={{ fontSize: 16 }} />,
                    color: 'error',
                    bgColor: 'error.light',
                    textColor: 'error.dark'
                };
            default:
                return {
                    icon: <AccessTime sx={{ fontSize: 16 }} />,
                    color: 'default',
                    bgColor: 'grey.200',
                    textColor: 'text.primary'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <Chip
            icon={config.icon}
            label={name}
            variant="outlined"
            color={config.color}
            sx={{
                mb: 1,
                '& .MuiChip-label': {
                    fontWeight: 500
                }
            }}
        />
    );
};

export default Process;