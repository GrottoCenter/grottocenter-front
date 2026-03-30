import React, { useState, useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TableBody,
  Paper,
  Typography,
  Box
} from '@mui/material';
import PropTypes from 'prop-types';
import SearchInput from '../../common/SearchInput';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import GCLink from '../../common/GCLink';
import CustomIcon from '../../common/CustomIcon';
import getLocalizedCountryName from '../../../helpers/countryName';
import { AVAILABLE_LANGUAGES } from '../../../conf/config';

const FlagImage = ({ iso2, alt }) => (
  <img
    src={`https://flagcdn.com/w20/${iso2.toLowerCase()}.png`}
    srcSet={`https://flagcdn.com/w40/${iso2.toLowerCase()}.png 2x`}
    width={24}
    alt={alt}
    style={{ display: 'block', borderRadius: 2 }}
  />
);

FlagImage.propTypes = {
  iso2: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
};

const CountryList = ({ countries = [] }) => {
  const { formatMessage, locale } = useIntl();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = col => {
    if (sortBy === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const languageDisplayName =
    AVAILABLE_LANGUAGES[locale]?.refName || 'English';

  const localizedCountries = useMemo(
    () =>
      countries.map(row => ({
        ...row,
        localized: getLocalizedCountryName(
          { enName: row.english, nativeName: row.native },
          formatMessage,
          locale,
          row.english
        )
      })),
    [countries, locale, formatMessage]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? localizedCountries.filter(
          row =>
            row.native.toLowerCase().includes(q) ||
            row.localized.toLowerCase().includes(q) ||
            row.iso2.toLowerCase().includes(q)
        )
      : localizedCountries;
    if (!sortBy) return list;
    return [...list].sort((a, b) => {
      const cmp = a[sortBy].localeCompare(b[sortBy]);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [localizedCountries, search, sortBy, sortDir]);

  return (
    <FixedContent
      title={formatMessage({ id: 'Countries' })}
      icon={<CustomIcon type="country" />}
      subheader={
        <Typography variant="subtitle2" color="text.secondary">
          {formatMessage({
            id: 'Sovereign countries and autonomous territories (ISO 3166-1)'
          })}
        </Typography>
      }
      content={
        <Box sx={{ maxWidth: 680 }}>
          <SearchInput value={search} onChange={setSearch} sx={{ mb: 2 }} />
          <TableContainer
            component={Paper}
            sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell />
                  {[
                    { col: 'native', labelId: 'Native' },
                    { col: 'localized', labelId: languageDisplayName },
                    { col: 'iso2', labelId: 'ISO' }
                  ].map(({ col, labelId }) => (
                    <TableCell
                      key={col}
                      sortDirection={sortBy === col ? sortDir : false}>
                      <TableSortLabel
                        active={sortBy === col}
                        direction={sortBy === col ? sortDir : 'asc'}
                        onClick={() => handleSort(col)}>
                        {formatMessage({ id: labelId })}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(row => (
                  <TableRow
                    key={row.iso2}
                    sx={{
                      '&:last-of-type td, &:last-of-type th': { border: 0 }
                    }}>
                    <TableCell sx={{ pr: 0, width: 40 }}>
                      <FlagImage iso2={row.iso2} alt={row.localized} />
                    </TableCell>
                    <TableCell component="th" scope="row">
                      <GCLink internal href={`/ui/countries/${row.iso2}`}>
                        {row.native}
                      </GCLink>
                    </TableCell>
                    <TableCell>
                      <GCLink internal href={`/ui/countries/${row.iso2}`}>
                        {row.localized}
                      </GCLink>
                    </TableCell>
                    <TableCell>{row.iso2}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ color: 'text.secondary' }}>
                      {formatMessage({ id: 'No results' })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
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
