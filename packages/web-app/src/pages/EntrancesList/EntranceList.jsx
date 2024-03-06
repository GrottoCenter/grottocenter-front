import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { List, Typography, Box, useTheme, Pagination } from '@mui/material';
import { styled } from '@mui/material/styles';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useSelector } from 'react-redux';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import EntranceListItem from './EntranceListItem';
import Alert from '../../components/common/Alert';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  justifyContent: 'space-between'
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
  const { entrances, handleClickScroll } = props;
  const { formatMessage } = useIntl();
  const nbEntrancesPerPage = 36;
  const theme = useTheme();
  const locale = useSelector(state => state.intl);

  const [entrancestoDisplay, setEntrancestoDisplay] = useState([]);
  const [page, setPage] = useState(1);
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

  // manage entrance list with pagination
  useEffect(() => {
    setEntrancestoDisplay(
      entrances.slice(
        (page - 1) * nbEntrancesPerPage,
        page * nbEntrancesPerPage
      )
    );
  }, [page, entrances]);

  return (
    <>
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
        <Box style={{ display: 'flex' }}>
          <Typography variant="h3" gutterBottom>
            {formatMessage({
              id: 'Entrance list and available data quality'
            })}
          </Typography>
          <Box onClick={handleClickScroll}>
            <HelpOutlineIcon
              style={{
                width: '15px',
                height: '15px',
                margin: '3px',
                color: theme.palette.secondary.main
              }}
            />
          </Box>
        </Box>
        <Box style={{ marginRight: '40px' }}>
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
      {entrancestoDisplay && entrancestoDisplay.length > 0 ? (
        <>
          <StyledList>
            {entrancestoDisplay.map(entrance => (
              <EntranceListItem
                key={entrance.id_entrance}
                entrance={entrance}
              />
            ))}
          </StyledList>
          {entrances.length > nbEntrancesPerPage && (
            <Box
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '10px'
              }}>
              <Pagination
                count={Math.ceil(entrances.length / nbEntrancesPerPage)}
                page={page}
                onChange={(o, p) => setPage(p)}
              />
            </Box>
          )}
        </>
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
  handleClickScroll: PropTypes.func
};

export default EntrancesList;
