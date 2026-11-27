import { useContext, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, IconButton, InputAdornment, Popover } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  bgBG,
  caES,
  deDE,
  elGR,
  esES,
  frFR,
  heIL,
  itIT,
  jaJP,
  nlNL,
  ptPT,
  roRO
} from '@mui/x-date-pickers/locales';
import { ar } from 'date-fns/locale/ar';
import { bg } from 'date-fns/locale/bg';
import { ca } from 'date-fns/locale/ca';
import { de } from 'date-fns/locale/de';
import { el } from 'date-fns/locale/el';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { fr } from 'date-fns/locale/fr';
import { he } from 'date-fns/locale/he';
import { id } from 'date-fns/locale/id';
import { it } from 'date-fns/locale/it';
import { ja } from 'date-fns/locale/ja';
import { nl } from 'date-fns/locale/nl';
import { pt } from 'date-fns/locale/pt';
import { ro } from 'date-fns/locale/ro';
import StringInput from '@/components/common/Form/StringInput';
import {
  getDocumentDate,
  isDocumentDateValid,
  normalizeDocumentDateInput,
  toDocumentDate
} from '@/utils/documentDate';
import { DocumentFormContext } from '../Provider';

const MIN_DATE = new Date(1000, 0, 1);
const dateLocales = {
  ar,
  bg,
  ca,
  de,
  el,
  en: enUS,
  es,
  fr,
  he,
  id,
  it,
  ja,
  nl,
  pt,
  ro
};
const calendarTranslations = {
  bg: bgBG,
  ca: caES,
  de: deDE,
  el: elGR,
  es: esES,
  fr: frFR,
  he: heIL,
  it: itIT,
  ja: jaJP,
  nl: nlNL,
  pt: ptPT,
  ro: roRO
};

const PublicationDatePicker = ({
  required = false,
  allowFuture = false,
  label = null
}) => {
  const { formatDate, formatMessage, locale } = useIntl();
  const { document, invalidField, updateAttribute } =
    useContext(DocumentFormContext);
  const [anchor, setAnchor] = useState(null);
  const [draft, setDraft] = useState(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  const calendarId = useId();
  const calendarLabel = formatMessage({ id: 'documentForm.calendar' });
  const { datePublication } = document;
  const invalid = !isDocumentDateValid(datePublication, allowFuture);
  const showFormatError = (hasBlurred || invalidField === 'date') && invalid;
  const dateLabel = label ?? formatMessage({ id: 'DatePublication' });
  const language = locale.split('-')[0];
  const examples = formatMessage(
    { id: 'documentForm.dateExamples' },
    {
      date: formatDate(new Date(2026, 10, 27), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        calendar: 'gregory',
        numberingSystem: 'latn'
      })
    }
  );
  const error = formatMessage({
    id: getDocumentDate(datePublication)
      ? 'documentForm.dateInFuture'
      : 'Invalid Date Format'
  });
  let errorText;
  if (showFormatError) errorText = error;
  else if (invalidField === 'date' && !datePublication)
    errorText = formatMessage(
      { id: 'documentForm.checkField' },
      { field: dateLabel }
    );
  const updateDate = value =>
    updateAttribute(
      'datePublication',
      normalizeDocumentDateInput(value, locale)
    );

  return (
    <Box
      sx={{ maxWidth: '36rem' }}
      data-testid="document-publication-date"
      data-document-field="date">
      <StringInput
        valueName={dateLabel}
        value={draft ?? datePublication}
        required={required}
        onValueChange={value => {
          setDraft(value);
          updateDate(value);
        }}
        onBlur={() => {
          setDraft(null);
          setHasBlurred(true);
        }}
        helperText={examples}
        errorText={errorText}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              type="button"
              aria-label={calendarLabel}
              aria-haspopup="dialog"
              aria-expanded={!!anchor}
              aria-controls={anchor ? calendarId : undefined}
              sx={{
                minWidth: { xs: 44, sm: 36 },
                minHeight: { xs: 44, sm: 36 }
              }}
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
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={dateLocales[language]}
          localeText={
            calendarTranslations[language]?.components.MuiLocalizationProvider
              .defaultProps.localeText
          }>
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
