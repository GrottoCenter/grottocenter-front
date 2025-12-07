import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { styled } from '@mui/material/styles';
import { TextField, Paper, List, ListItem, ListItemText, CircularProgress, InputAdornment } from '@mui/material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { NOMINATIM_API_URL } from '../../../../conf/config';

const SearchContainer = styled(Paper)`
  position: absolute;
  top: 10px;
  left: 50px;
  z-index: 1000;
  padding: 4px;
  min-width: 250px;

  .MuiTextField-root {
    .MuiInputBase-root {
      height: 32px;
      input {
        padding: 0 10px;
      }
    }
  }
`;

const ResultsList = styled(List)`
  max-height: 200px;
  overflow-y: auto;
`;

const StyledListItem = styled(ListItem)`
  cursor: pointer !important;
  padding: 0 14px;
  margin: 0;
`;

const ADDRESS_TYPE_PRIORITY = {
  house: 1, building: 2, amenity: 3, tourism: 4, leisure: 5,
  road: 6, highway: 7, hamlet: 8, village: 9,
  suburb: 10, neighbourhood: 11, quarter: 12,
  town: 13, city: 14, municipality: 15,
  county: 16, district: 17,
  state: 18, province: 19, region: 20,
  country: 21, continent: 22
};

const GeocodingControl = ({ onLocationSelect }) => {
  const map = useMap();
  const { formatMessage, locale } = useIntl();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const container = map.getContainer();
    const handleWheel = e => {
      if (e.target.closest('.results-list')) {
        e.stopPropagation();
      }
    };
    container.addEventListener('wheel', handleWheel, { capture: true });
    return () => container.removeEventListener('wheel', handleWheel, { capture: true });
  }, [map]);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const bounds = map.getBounds();
        const viewbox = `${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}`;
        const response = await fetch(
          `${NOMINATIM_API_URL}?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=${locale}&viewbox=${viewbox}`
        );
        const data = await response.json();
        const sorted = data.sort((a, b) => (ADDRESS_TYPE_PRIORITY[a.addresstype] || 99) - (ADDRESS_TYPE_PRIORITY[b.addresstype] || 99));
        setResults(sorted);
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setLoading(false);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [query, locale, map]);

  const handleSelect = result => {
    setQuery('');
    setResults([]);
    
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    if (onLocationSelect) {
      onLocationSelect({ lat, lng });
    }
    
    setTimeout(() => {
      if (result.boundingbox) {
        const [south, north, west, east] = result.boundingbox.map(parseFloat);
        map.fitBounds([[south, west], [north, east]]);
      } else {
        map.setView([lat, lng], map.getZoom());
      }
    }, 100);
  };

  return (
    <SearchContainer elevation={3}>
      <TextField
        size="small"
        fullWidth
        placeholder={formatMessage({ id: 'Search location...' })}
        value={query}
        onChange={e => setQuery(e.target.value)}
        slotProps={{
          input: {
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }
        }}
      />
      {results.length > 0 && (
        <ResultsList className="results-list">
          {results.map(result => (
            <StyledListItem
              key={result.place_id}
              onClick={() => handleSelect(result)}>
              <ListItemText 
                primary={result.display_name}
                secondary={formatMessage({ id: `addresstype.${result.addresstype}`, defaultMessage: result.addresstype })}
              />
            </StyledListItem>
          ))}
        </ResultsList>
      )}
    </SearchContainer>
  );
};

GeocodingControl.propTypes = {
  onLocationSelect: PropTypes.func
};

export default GeocodingControl;
