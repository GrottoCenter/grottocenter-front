import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { List, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import EntranceListItem from './EntranceListItem';
import Alert from '../../components/common/Alert';
import DataQualityHelpButton from '../../components/common/DataQualityBadge/DataQualityHelpButton';

const StyledList = styled(List)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))',
  width: '100%',
  gap: '10px',
  padding: 0
});

const getFormatDate = (date, formatMessage, locale) => {
  const dateAsString = date.toLocaleDateString();
  const time = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
  const distanceToNow = formatDistanceToNow(date);

  // manage translation
  const at = formatMessage({ id: 'at' });
  return `${dateAsString} ${at} ${time} (${distanceToNow})`;
};

const EntrancesList = props => {
  const { entrances } = props;
  const { formatMessage } = useIntl();
  const locale = useSelector(state => state.intl);

  const [dateOfUpdate, setDateOfUpdate] = useState(null);

  // manage format of date of update
  useEffect(() => {
    if (entrances && entrances[0]) {
      const date = new Date(entrances[0].date_of_update);
      setDateOfUpdate(getFormatDate(date, formatMessage, locale));
    } else {
      setDateOfUpdate(null);
    }
  }, [entrances, formatMessage, locale]);

  return (
    <>
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h3" gutterBottom>
            {formatMessage({
              id: 'Entrance list and available data quality'
            })}
          </Typography>
          <DataQualityHelpButton />
        </Box>
        <Box>
          {dateOfUpdate && (
            <>
              <Typography variant="body2">
                {formatMessage({ id: 'Date of last data update :' })}
              </Typography>
              <Typography variant="body2">{dateOfUpdate}</Typography>
            </>
          )}
        </Box>
      </Box>
      {entrances && entrances.length > 0 ? (
        <StyledList>
          {entrances.map(entrance => (
            <EntranceListItem
              key={entrance.id_entrance}
              entrance={entrance}
            />
          ))}
        </StyledList>
      ) : (
        <Alert
          title={formatMessage({
            id: 'There is no entrance in this massif.'
          })}
          severity="warning"
        />
      )}
    </>
  );
};

EntrancesList.propTypes = {
  entrances: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      id_entrance: PropTypes.number,
      data_quality: PropTypes.number,
      id_massif: PropTypes.number,
      name_massif: PropTypes.string,
      date_of_update: PropTypes.string
    })
  ),
};

export default EntrancesList;
