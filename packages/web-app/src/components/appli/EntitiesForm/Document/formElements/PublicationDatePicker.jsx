import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { set as setDate } from 'date-fns';

import { DocumentFormContext } from '../Provider';
import Translate from '../../../../common/Translate';

const GRANULARITY = {
  YEAR: 'year',
  YEAR_MONTH: 'year_month',
  FULL: 'full'
};

const VIEWS = {
  [GRANULARITY.YEAR]: ['year'],
  [GRANULARITY.YEAR_MONTH]: ['year', 'month'],
  [GRANULARITY.FULL]: ['year', 'month', 'day']
};

const FORMATS = {
  [GRANULARITY.YEAR]: 'yyyy',
  [GRANULARITY.YEAR_MONTH]: 'MM/yyyy',
  [GRANULARITY.FULL]: 'dd/MM/yyyy'
};

const getDateFromString = dateString => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  return setDate(new Date(), {
    year: parts[0],
    month: parts.length > 1 ? parts[1] - 1 : 0,
    date: parts.length > 2 ? parts[2] : 1
  });
};

const getGranularityFromString = dateString => {
  if (!dateString) return GRANULARITY.YEAR;
  const parts = dateString.split('-');
  if (parts.length === 3) return GRANULARITY.FULL;
  if (parts.length === 2) return GRANULARITY.YEAR_MONTH;
  return GRANULARITY.YEAR;
};

const PublicationDatePicker = ({ required = false, label = null }) => {
  const { formatMessage } = useIntl();
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [granularity, setGranularity] = useState(
    getGranularityFromString(document.datePublication)
  );

  const handleGranularityChange = (_, newGranularity) => {
    if (!newGranularity) return;
    setGranularity(newGranularity);
    updateAttribute('datePublication', '');
  };

  const handleDateChange = newDate => {
    if (!newDate) {
      updateAttribute('datePublication', '');
      return;
    }
    const year = newDate.getFullYear();
    const month = newDate.getMonth() + 1;
    const day = newDate.getDate();
    const mm = month < 10 ? `0${month}` : month;
    const dd = day < 10 ? `0${day}` : day;

    if (granularity === GRANULARITY.YEAR) {
      updateAttribute('datePublication', String(year));
    } else if (granularity === GRANULARITY.YEAR_MONTH) {
      updateAttribute('datePublication', `${year}-${mm}`);
    } else {
      updateAttribute('datePublication', `${year}-${mm}-${dd}`);
    }
  };

  const granularityOptions = [
    {
      value: GRANULARITY.YEAR,
      label: formatMessage({ id: 'Year' })
    },
    {
      value: GRANULARITY.YEAR_MONTH,
      label: isMobile
        ? formatMessage({ id: 'Year + Month short' })
        : formatMessage({ id: 'Year & Month' })
    },
    {
      value: GRANULARITY.FULL,
      label: isMobile
        ? formatMessage({ id: 'Full Date short' })
        : formatMessage({ id: 'Full Date' })
    }
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label ?? (
            <Translate>
              Publication date (refer to the date indicated on the document if
              any)
            </Translate>
          )}
          {required && (
            <Box component="span" aria-hidden sx={{ color: 'error.main', ml: 0.3 }}>
              {'*'}
            </Box>
          )}
        </Typography>
      </Box>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ToggleButtonGroup
          value={granularity}
          exclusive
          onChange={handleGranularityChange}
          size="small"
          aria-label={formatMessage({ id: 'Date precision' })}
          sx={{ display: 'flex', width: '100%', mb: 0 }}>
          {granularityOptions.map(opt => (
            <ToggleButton key={opt.value} value={opt.value} sx={{ flex: 1 }}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <DatePicker
          format={FORMATS[granularity]}
          views={VIEWS[granularity]}
          openTo={VIEWS[granularity][0]}
          value={getDateFromString(document.datePublication)}
          onChange={handleDateChange}
          minDate={new Date('1000-01-01')}
          disableFuture
          slotProps={{
            textField: {
              fullWidth: true,
              required,
              error: required && !document.datePublication,
              sx: {
                '& .MuiOutlinedInput-root': {
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0
                }
              }
            }
          }}
        />
      </LocalizationProvider>
    </Box>
  );
};

PublicationDatePicker.propTypes = {
  label: PropTypes.node,
  required: PropTypes.bool
};

export default PublicationDatePicker;
