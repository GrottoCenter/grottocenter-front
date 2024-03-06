import React from 'react';
import { useIntl } from 'react-intl';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import PropTypes from 'prop-types';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import GCLink from '../../common/GCLink';

const CountryList = ({ countries }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      title={formatMessage({
        id: 'Countries : Sovereign countries and autonomous territories (ISO 3166-1)'
      })}
      content={
        <TableContainer component={Paper} style={{ width: '500px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{formatMessage({ id: 'Native' })}</TableCell>
                <TableCell>{formatMessage({ id: 'English' })}</TableCell>
                <TableCell>{formatMessage({ id: 'ISO' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {countries.map(row => (
                <TableRow
                  key={row.iso2}
                  style={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <GCLink internal href={`/ui/countries/${row.iso2}`}>
                      {row.native}
                    </GCLink>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <GCLink internal href={`/ui/countries/${row.iso2}`}>
                      {row.english}
                    </GCLink>
                  </TableCell>
                  <TableCell align="right">{row.iso2}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      }
    />
  );
};

CountryList.propTypes = {
  countries: PropTypes.arrayOf(
    PropTypes.shape({
      iso2: PropTypes.string.isRequired,
      english: PropTypes.string.isRequired,
      native: PropTypes.string.isRequired
    })
  )
};

CountryList.defaultProps = {
  countries: []
};

export default CountryList;
