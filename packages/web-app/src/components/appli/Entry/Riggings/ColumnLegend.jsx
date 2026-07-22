import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Box,
  Divider,
  IconButton,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const LegendItemsShape = PropTypes.arrayOf(
  PropTypes.shape({
    abbrevKey: PropTypes.string.isRequired,
    labelKey: PropTypes.string.isRequired
  })
);

const LegendSection = ({ titleKey, items }) => {
  const { formatMessage } = useIntl();
  return (
    <Box>
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
                <Typography variant="body2" fontWeight="bold" component="span">
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
  );
};

LegendSection.propTypes = {
  titleKey: PropTypes.string.isRequired,
  items: LegendItemsShape.isRequired
};

const ColumnLegend = ({ titleKey, items, sections, label }) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  const resolvedSections = sections ?? [{ titleKey, items }];
  const triggerLabel = formatMessage({ id: label ?? titleKey });

  return (
    <>
      <Tooltip title={triggerLabel}>
        <IconButton
          size="small"
          onClick={e => setAnchorEl(e.currentTarget)}
          aria-label={triggerLabel}
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
          <Stack spacing={1}>
            {resolvedSections.map(section => (
              <LegendSection
                key={section.titleKey}
                titleKey={section.titleKey}
                items={section.items}
              />
            ))}
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

ColumnLegend.propTypes = {
  titleKey: PropTypes.string,
  items: LegendItemsShape,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      titleKey: PropTypes.string.isRequired,
      items: LegendItemsShape.isRequired
    })
  ),
  label: PropTypes.string
};

export default ColumnLegend;
