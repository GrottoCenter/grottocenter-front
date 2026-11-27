import { useContext, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, IconButton, InputAdornment, Popover } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import StringInput from '@/components/common/Form/StringInput';
import {
  getDocumentDate,
  isDocumentDateValid,
  toDocumentDate
} from '@/utils/documentDate';
import { DocumentFormContext } from '../Provider';

const MIN_DATE = new Date(1000, 0, 1);

const PublicationDatePicker = ({
  required = false,
  allowFuture = false,
  label = null
}) => {
  const { formatMessage } = useIntl();
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const [anchor, setAnchor] = useState(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  const calendarId = useId();
  const calendarLabel = formatMessage({ id: 'documentForm.calendar' });
  const { datePublication } = document;
  const invalid = !isDocumentDateValid(datePublication, allowFuture);
  const hasError = hasBlurred && invalid;
  const updateDate = value => updateAttribute('datePublication', value.trim());

  return (
    <Box sx={{ maxWidth: '36rem' }} data-testid="document-publication-date">
      <StringInput
        valueName={label ?? formatMessage({ id: 'DatePublication' })}
        value={datePublication}
        required={required}
        onValueChange={updateDate}
        onBlur={() => setHasBlurred(true)}
        hasError={hasError}
        helperText={formatMessage({
          id: hasError ? 'Invalid Date Format' : 'documentForm.dateExamples'
        })}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              type="button"
              aria-label={calendarLabel}
              aria-haspopup="dialog"
              aria-expanded={!!anchor}
              aria-controls={anchor ? calendarId : undefined}
              onClick={event => setAnchor(event.currentTarget)}>
              <CalendarTodayIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        }
      />
      <Popover
        id={calendarId}
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { role: 'dialog', 'aria-label': calendarLabel } }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateCalendar
            autoFocus
            value={invalid ? null : getDocumentDate(datePublication)}
            minDate={MIN_DATE}
            disableFuture={!allowFuture}
            onChange={(date, selectionState) => {
              if (!date || selectionState !== 'finish') return;
              updateDate(toDocumentDate(date));
              setAnchor(null);
            }}
            sx={{ maxWidth: '100%' }}
          />
        </LocalizationProvider>
      </Popover>
    </Box>
  );
};

PublicationDatePicker.propTypes = {
  allowFuture: PropTypes.bool,
  label: PropTypes.string,
  required: PropTypes.bool
};

export default PublicationDatePicker;
