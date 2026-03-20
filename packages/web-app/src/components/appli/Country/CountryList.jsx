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
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import GCLink from '../../common/GCLink';
import getLocalizedCountryName from '../../../helpers/countryName';
import { AVAILABLE_LANGUAGES } from '../../../conf/config';

const CountryList = ({ countries = [] }) => {
  const { formatMessage, locale } = useIntl();

  const getLanguageDisplayName = () => {
    return AVAILABLE_LANGUAGES[locale]?.refName || 'English';
  };

  return (
    <FixedContent
      title={formatMessage({
        id: 'Countries : Sovereign countries and autonomous territories (ISO 3166-1)'
      })}
      content={
        <TableContainer component={Paper} sx={{ maxWidth: 500 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{formatMessage({ id: 'Native' })}</TableCell>
                <TableCell>{formatMessage({ id: getLanguageDisplayName() })}</TableCell>
                <TableCell>{formatMessage({ id: 'ISO' })}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {countries.map(row => (
                <TableRow
                  key={row.iso2}
                  sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <GCLink internal href={`/ui/countries/${row.iso2}`}>
                      {row.native}
                    </GCLink>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <GCLink internal href={`/ui/countries/${row.iso2}`}>
                      {getLocalizedCountryName(
                        { enName: row.english, nativeName: row.native },
                        formatMessage,
                        locale,
                        row.english
                      )}
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

export default CountryList;
