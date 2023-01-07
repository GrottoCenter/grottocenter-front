import React, { useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { Button, FormHelperText, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers';

import { set as setDate } from 'date-fns';
import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';

const StyledDatePicker = styled(DatePicker)(() => ({
  margin: 0,
  width: '100%'
}));

const ButtonsFlexWrapper = styled('div')(() => ({
  display: 'flex',
  padding: '4px'
}));

const DateButton = styled(Button)(() => ({
  flex: 1
}));

const dateTypeFormats = {
  YEAR: 'yyyy',
  YEAR_MONTH: 'MM/yyyy',
  YEAR_MONTH_DAY: 'dd/MM/yyyy'
};

const MIN_DATE = new Date('1000-01-01');

const PublicationDatePicker = ({ required = false }) => {
  const { formatMessage, formatDate } = useIntl();
  const [error, setError] = useState(null);
  const {
    docAttributes: { publicationDate },
    updateAttribute
  } = useContext(DocumentFormContext);

  const [dateTypes, setDateTypes] = useState(
    // Default date format type is deduced from the publicationDate
    publicationDate === ''
      ? ['year', 'month', 'day']
      : ['year', 'month', 'day'].slice(0, publicationDate.split('-').length)
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const handleDateTypesChanges = newTypes => {
    if (newTypes !== dateTypes) {
      setDateTypes(newTypes);
      setIsDatePickerOpen(true);
    }
  };

  const getDisplayedDateFormat = () => {
    if (dateTypes.includes('month')) {
      if (dateTypes.includes('day')) {
        return dateTypeFormats.YEAR_MONTH_DAY;
      }
      return dateTypeFormats.YEAR_MONTH;
    }
    return dateTypeFormats.YEAR;
  };

  /**
   * Cast the new Date picked from a Date object to a string
   * (according to the date format selected) and update it in the Provider.
   * The string format used is yyyy-MM-dd.
   * For month and day < 10, we should add a 0 before it.
   * EXAMPLE :
   *      - 5/3/1996 and YEAR_MONTH_DAY format => '1996-03-05'
   *      - 5/3/1996 and YEAR_MONTH format => '1996-03'
   *      - 5/3/1996 and YEAR format => '1996'
   *
   * @param {Date} newDate
   */
  const handleDateChange = newDate => {
    if (newDate === null) {
      updateAttribute('publicationDate', '');
      return;
    }
    const year = newDate.getFullYear();
    const month = newDate.getMonth() + 1;
    const day = newDate.getDate();
    if (getDisplayedDateFormat() === dateTypeFormats.YEAR) {
      updateAttribute('publicationDate', String(year));
    } else if (getDisplayedDateFormat() === dateTypeFormats.YEAR_MONTH) {
      updateAttribute(
        'publicationDate',
        `${year}-${month < 10 ? `0${month}` : month}`
      );
    } else {
      updateAttribute(
        'publicationDate',
        `${year}-${month < 10 ? `0${month}` : month}-${
          day < 10 ? `0${day}` : day
        }`
      );
    }
  };

  const handleError = reason => {
    switch (reason) {
      case 'disableFuture':
        setError(
          formatMessage({ id: 'Date should be in the past or present.' })
        );
        break;
      case 'minDate':
        setError(
          formatMessage(
            {
              id: 'Date should be after {date}.',
              defaultMessage: 'Date should be after {date}.'
            },
            {
              date: formatDate(MIN_DATE)
            }
          )
        );
        break;
      case 'invalidDate':
        setError(formatMessage({ id: 'Invalid date.' }));
        break;
      default:
        setError(reason);
    }
  };

  /**
   * From a given date string with format 'yyyy-MM-dd' with
   * MM and dd optional, return a JS Date.
   * MM is getMonth() JS Date API month + 1.
   * If the string is empty, return null.
   * @param {String} dateString
   */
  const getDateObjFromDateString = dateString => {
    if (dateString === '') return null;
    const splittedDate = dateString.split('-');
    return setDate(new Date(), {
      year: splittedDate[0],
      month: splittedDate.length > 1 ? splittedDate[1] - 1 : undefined,
      date: splittedDate.length > 2 ? splittedDate[2] : undefined
    });
  };

  const memoizedValues = [
    dateTypes,
    isDatePickerOpen,
    publicationDate,
    required
  ];

  return useMemo(
    () => (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <StyledDatePicker
          disableFuture
          id="date-picker-dialog"
          inputFormat={getDisplayedDateFormat()}
          label={<Translate>Publication Date</Translate>}
          minDate={MIN_DATE}
          onChange={date => handleDateChange(date)}
          onClose={() => setIsDatePickerOpen(false)}
          onError={handleError}
          onOpen={() => setIsDatePickerOpen(true)}
          open={isDatePickerOpen}
          renderInput={params => (
            <TextField
              {...params}
              error={!!error}
              required={required}
              helperText={!!error && error}
            />
          )}
          required={required}
          value={getDateObjFromDateString(publicationDate)}
          views={dateTypes}
        />
        <ButtonsFlexWrapper>
          <DateButton
            color="primary"
            size="small"
            onClick={() => handleDateTypesChanges(['year'])}>
            <Translate>Year</Translate>
          </DateButton>
          <DateButton
            color="primary"
            size="small"
            style={{ margin: '0 4px' }}
            onClick={() => handleDateTypesChanges(['year', 'month'])}>
            <Translate>Year & Month</Translate>
          </DateButton>
          <DateButton
            color="primary"
            size="small"
            onClick={() => handleDateTypesChanges(['year', 'month', 'day'])}>
            <Translate>Full Date</Translate>
          </DateButton>
        </ButtonsFlexWrapper>
        <FormHelperText>
          <Translate>
            Date on which the document you submit was made public. You can refer
            to the date indicated on the document.
          </Translate>
        </FormHelperText>
      </LocalizationProvider>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    memoizedValues
  );
};

PublicationDatePicker.propTypes = {
  required: PropTypes.bool
};

export default PublicationDatePicker;
