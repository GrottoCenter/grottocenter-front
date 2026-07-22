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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const ColumnLegend = ({ titleKey, items }) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <Tooltip title={formatMessage({ id: titleKey })}>
        <IconButton
          size="small"
          onClick={e => setAnchorEl(e.currentTarget)}
          aria-label={formatMessage({ id: titleKey })}
          sx={{
            ml: 0.5,
            color: 'inherit',
            opacity: 0.8,
            verticalAlign: 'middle'
          }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        <Box sx={{ pt: 1, px: 1, pb: 1, minWidth: 160 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
            {formatMessage({ id: titleKey })}
          </Typography>
          <Divider sx={{ mb: 0.5 }} />
          <Table size="small" sx={{ mb: 0.25 }}>
            <TableBody>
              {items.map(({ abbrevKey, labelKey }) => (
                <TableRow key={abbrevKey}>
                  <TableCell sx={{
                    border: 0,
                    pr: 2
                  }}>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      component="span">
                      {formatMessage({ id: abbrevKey })}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{
                    border: 0
                  }}>
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

ColumnLegend.propTypes = {
  titleKey: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      abbrevKey: PropTypes.string.isRequired,
      labelKey: PropTypes.string.isRequired
    })
  ).isRequired
};

export default ColumnLegend;
