import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Link, List, ListItem, ListItemText } from '@mui/material';

const ManagedEntitiesSection = ({ organization }) => {
  const { formatMessage } = useIntl();

  const countries = organization?.countries || [];
  const regions = organization?.regions || [];
  const massifs = organization?.massifs || [];

  if (countries.length === 0 && regions.length === 0 && massifs.length === 0) {
    return null;
  }

  const sortByName = (a, b) => a.name.localeCompare(b.name);

  const sortedCountries = [...countries].sort(sortByName);
  const sortedRegions = [...regions].sort(sortByName);
  const sortedMassifs = [...massifs].sort(sortByName);

  const renderList = (items, getLink) => (
    <List dense disablePadding>
      {items.map(item => (
        <ListItem key={item.id} sx={{ px: 0, py: 0.5 }}>
          <ListItemText
            primary={
              <Link component={RouterLink} to={getLink(item)}>
                {item.name}
              </Link>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ my: 2 }}>
      {sortedCountries.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1 }}>
            {formatMessage({ id: 'Countries' })}
          </Typography>
          {renderList(sortedCountries, country => `/ui/countries/${country.id}`)}
        </Box>
      )}

      {sortedRegions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1 }}>
            {formatMessage({ id: 'Regions' })}
          </Typography>
          {renderList(sortedRegions, region => {
            // Region IDs generally follow the full ISO 3166-2 'COUNTRY-REGION' format (e.g., 'FR-12').
            // The frontend routing and backend API (/countries/:countryId/regions/:regionId) 
            // both expect the country ID and the region suffix separately. 
            // We split at the first hyphen to extract the suffix (e.g., 'FR-ARA' -> country 'FR', region 'ARA').
            // If the ID does not contain a hyphen, the API is expected to provide `region.countryId`.
            // Without `countryId`, we fallback to the countries list to prevent broken links on 'undefined'.
            const regionIdStr = String(region.id);
            const firstHyphenIndex = regionIdStr.indexOf('-');
            
            const countryId = firstHyphenIndex !== -1 ? regionIdStr.substring(0, firstHyphenIndex) : region.countryId;
            const regionId = firstHyphenIndex !== -1 ? regionIdStr.substring(firstHyphenIndex + 1) : region.id;

            if (!countryId) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn(
                  `ManagedEntitiesSection: could not determine countryId for region "${region.name}" (id: ${region.id}). ` +
                    'Expected an ISO 3166-2 "COUNTRY-REGION" id or a region.countryId field. Falling back to the countries list.'
                );
              }
              return '/ui/countries';
            }

            return `/ui/countries/${countryId}/regions/${regionId}`;
          })}
        </Box>
      )}

      {sortedMassifs.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1 }}>
            {formatMessage({ id: 'Massifs' })}
          </Typography>
          {renderList(sortedMassifs, massif => `/ui/massifs/${massif.id}`)}
        </Box>
      )}
    </Box>
  );
};

ManagedEntitiesSection.propTypes = {
  organization: PropTypes.shape({
    countries: PropTypes.array,
    regions: PropTypes.array,
    massifs: PropTypes.array
  }).isRequired
};

export default ManagedEntitiesSection;
