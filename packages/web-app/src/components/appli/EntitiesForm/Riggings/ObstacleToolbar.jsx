import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  IconButton,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const LEGEND_ITEMS = [
  { abbrevKey: 'obstacle.abbrev.pit', labelKey: 'obstacle.label.pit' },
  { abbrevKey: 'obstacle.abbrev.step', labelKey: 'obstacle.label.step' },
  { abbrevKey: 'obstacle.abbrev.climb', labelKey: 'obstacle.label.climb' },
  { abbrevKey: 'obstacle.abbrev.waterfall', labelKey: 'obstacle.label.waterfall' }
];

const ObstacleToolbar = () => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <Tooltip title={formatMessage({ id: 'Obstacle notation legend' })} placement="top">
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
          aria-label={formatMessage({ id: 'Obstacle notation legend' })}
          sx={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: 4,
            zIndex: 1,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' }
          }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Box sx={{ pt: 1.5, px: 2, pb: 1, minWidth: 180 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {formatMessage({ id: 'Obstacle notation legend' })}
          </Typography>
          <Table size="small">
            <TableBody>
              {LEGEND_ITEMS.map(({ abbrevKey, labelKey }) => (
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

export default ObstacleToolbar;
