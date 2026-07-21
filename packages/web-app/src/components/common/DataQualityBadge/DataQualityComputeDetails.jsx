import React from 'react';
import { useIntl } from 'react-intl';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import DataQualityComputeTable from './DataQualityComputeTable';

const DataQualityComputeDetails = () => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  return (
    <Box display="flex" flexDirection="column" gap={1} p={1}>
      <Typography variant="body2">
        {formatMessage({
          id: 'The quality of the data is calculated from the information available on the cave, the number of people who provided information and the date of the last contributions. This allows us to build a value between 3 and 100.'
        })}
      </Typography>
      <Box>
        <Typography variant="body2" gutterBottom>
          {formatMessage({ id: 'The chosen color code is as follows:' })}
        </Typography>
        <Typography variant="body2" component="div">
          <Box component="span" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
            {`${formatMessage({ id: 'Insufficient' })} (${formatMessage({ id: 'index < 40' })})`}
          </Box>
          {` — ${formatMessage({ id: 'The quality is insufficient an effort must be made to provide quality information.' })}`}
          <br />
          <Box component="span" sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>
            {`${formatMessage({ id: 'Satisfactory' })} (${formatMessage({ id: '40 ≤ index < 70' })})`}
          </Box>
          {` — ${formatMessage({ id: 'The quality of the data is satisfactory but it can be improved.' })}`}
          <br />
          <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
            {`${formatMessage({ id: 'Good' })} (${formatMessage({ id: 'index ≥ 70' })})`}
          </Box>
          {` — ${formatMessage({ id: 'The data provided is of high quality, a verification would guarantee the quality level of this data.' })}`}
        </Typography>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <DataQualityComputeTable />
      </Box>
    </Box>
  );
};

export default DataQualityComputeDetails;
