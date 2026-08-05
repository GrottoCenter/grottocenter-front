import { useState, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Typography, Skeleton, Box, Chip } from '@mui/material';
import PropTypes from 'prop-types';
import { regionsSearchUrl } from '../../../conf/apiRoutes';
import SearchInput from '../../common/SearchInput';
import AppLink from '../../common/AppLink';

/*
 * Regions list — layout decisions
 *
 * All regions are fetched in a single request (limit=500) rather than paginated
 * because:
 *   - ISO 3166-2 subdivision counts are bounded (~217 max for the UK, <100 for
 *     most countries). The network payload is negligible.
 *   - It enables instant client-side filtering via SearchInput without a server
 *     round-trip on every keystroke.
 *   - Pagination would cause a skeleton flash and scroll-position loss on every
 *     page change.
 *
 * Rendering: CSS multi-column list (column-count responsive: 1/2/3 by
 * breakpoint) rather than a table, because:
 *   - Regions only carry two data points (name + ISO code): a 2-column table
 *     adds little value over a plain list.
 *   - CSS columns automatically balance items into equal-height columns in
 *     natural alphabetical order (top→bottom, then next column), with no JS
 *     splitting logic needed.
 *   - On mobile (xs), falls back to a single column to avoid overly narrow
 *     items.
 */
const MAX_REGIONS_FETCH_LIMIT = 500; // ISO 3166-2 max is ~217 (UK); bounded by design

const fetchAllRegions = async countryId => {
  const response = await fetch(
    `${regionsSearchUrl}?query=${countryId}-&offset=0&limit=${MAX_REGIONS_FETCH_LIMIT}`,
    { method: 'POST' }
  );
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return (data.results || [])
    .filter(
      item => item.type === 'region' && item.iso?.startsWith(`${countryId}-`)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
};

const useRegions = countryId => {
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!countryId) return;
    setIsLoading(true);
    setError(null);
    fetchAllRegions(countryId)
      .then(setRegions)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [countryId]);

  return { regions, isLoading, error };
};

const RegionsList = ({ countryId }) => {
  const { formatMessage } = useIntl();
  const { regions, isLoading, error } = useRegions(countryId);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter(
      r => r.name.toLowerCase().includes(q) || r.iso.toLowerCase().includes(q)
    );
  }, [regions, search]);

  if (isLoading) {
    return (
      <>
        <Skeleton height={30} />
        <Skeleton height={30} />
        <Skeleton height={30} />
      </>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {formatMessage({ id: 'Error loading regions' })}
      </Typography>
    );
  }

  if (regions.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        {formatMessage({ id: 'No regions found' })}
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: -1 }}>
      {regions.length > 10 && (
        <SearchInput value={search} onChange={setSearch} sx={{ mb: 0.5 }} />
      )}
      {filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {formatMessage({ id: 'No results' })}
        </Typography>
      ) : (
        <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 8 }}>
          {filtered.map(region => (
            <Box
              key={region.iso}
              component={AppLink}
              to={`/ui/countries/${countryId}/regions/${region.iso.split('-')[1]}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 0.5,
                px: 0.5,
                borderRadius: 1,
                textDecoration: 'none',
                color: 'text.primary',
                breakInside: 'avoid',
                '&:hover': { backgroundColor: 'action.hover' }
              }}>
              <Chip
                label={region.iso.split('-')[1]}
                color="primary"
                size="small"
                sx={{ mr: 0.5, flexShrink: 0 }}
              />
              <Typography variant="body1">{region.name}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

RegionsList.propTypes = {
  countryId: PropTypes.string.isRequired
};

export default RegionsList;
