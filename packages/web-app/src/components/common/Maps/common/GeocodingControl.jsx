import React, { useState, useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { styled } from '@mui/material/styles';
import { TextField, Paper, List, ListItem, ListItemAvatar, ListItemText, CircularProgress, InputAdornment } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  NOMINATIM_API_URL,
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  AUTOCOMPLETE_MIN_CHARACTERS,
  ADVANCED_SEARCH_TYPES
} from '../../../../conf/config';
import { advancedSearchUrl, getCaveUrl } from '../../../../conf/apiRoutes';
import CustomIcon from '../../CustomIcon';

const SearchContainer = styled(Paper)`
  position: absolute;
  top: 10px;
  left: 50px;
  z-index: 1000;
  padding: 4px;
  min-width: 250px;
  /* Let some space for the eye button and prevent overflow on small screens */
  max-width: calc(100% - 115px);

  /* Increase width on desktop to fit full placeholder text */
  @media (min-width: 1024px) {
    min-width: 350px;
    max-width: calc(100% - 115px);
  }

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
  padding: 0 8px;
  margin: 0;

  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }

  .MuiListItemAvatar-root {
    min-width: 36px;
    margin-top: 4px;
  }

  .MuiListItemText-root {
    margin: 4px 0;
  }

  .MuiListItemText-secondary {
    font-size: 1.2rem;
    line-height: 1.2;
  }
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

const GeocodingControl = ({ onLocationSelect, onOrganizationSelect }) => {
  const map = useMap();
  const { formatMessage, locale } = useIntl();
  const [query, setQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [entranceResults, setEntranceResults] = useState([]);
  const [networkResults, setNetworkResults] = useState([]);
  const [organizationResults, setOrganizationResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntrance, setSelectedEntrance] = useState(null);

  const hasResults = locationResults.length > 0 || entranceResults.length > 0 || networkResults.length > 0 || organizationResults.length > 0;

  useEffect(() => {
    if (!hasResults) return undefined;

    const container = map.getContainer();

    // Prevent map interactions when scrolling/touching the results list
    const handleEvent = e => {
      if (e.target.closest('.results-list')) {
        e.stopPropagation();
      }
    };

    container.addEventListener('wheel', handleEvent, { capture: true });
    container.addEventListener('touchstart', handleEvent, { capture: true, passive: true });
    container.addEventListener('touchmove', handleEvent, { capture: true, passive: true });

    return () => {
      container.removeEventListener('wheel', handleEvent, { capture: true });
      container.removeEventListener('touchstart', handleEvent, { capture: true });
      container.removeEventListener('touchmove', handleEvent, { capture: true });
    };
  }, [map, hasResults]);

  // Open popup on the entrance marker once it appears on the map
  useEffect(() => {
    if (!selectedEntrance) return undefined;

    const { lat, lng } = selectedEntrance;

    const isTargetMarker = layer =>
      layer instanceof L.Marker &&
      Math.abs(layer.getLatLng().lat - lat) < 0.001 &&
      Math.abs(layer.getLatLng().lng - lng) < 0.001;

    // Check markers already on the map
    let found = false;
    map.eachLayer(layer => {
      if (!found && isTargetMarker(layer)) {
        layer.openPopup();
        found = true;
      }
    });
    if (found) {
      setSelectedEntrance(null);
      return undefined;
    }

    // Otherwise listen for new layers being added
    const onLayerAdd = e => {
      if (isTargetMarker(e.layer)) {
        e.layer.openPopup();
        setSelectedEntrance(null);
        map.off('layeradd', onLayerAdd);
      }
    };
    map.on('layeradd', onLayerAdd);

    // Safety timeout: if the marker never appears (e.g. filtered out by zoom/bounds),
    // stop listening after 5s to avoid a permanent leak. 5s is enough for the map
    // to finish animating, loading tiles, and rendering the new markers.
    const timeout = setTimeout(() => {
      map.off('layeradd', onLayerAdd);
      setSelectedEntrance(null);
    }, 5000);

    return () => {
      map.off('layeradd', onLayerAdd);
      clearTimeout(timeout);
    };
  }, [selectedEntrance, map]);

  useEffect(() => {
    if (query.length < AUTOCOMPLETE_MIN_CHARACTERS) {
      setLocationResults([]);
      setEntranceResults([]);
      setNetworkResults([]);
      setOrganizationResults([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const bounds = map.getBounds();
        const viewbox = `${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}`;

        // Parallel API calls
        const [locationData, entranceData, networkData, organizationData] = await Promise.all([
          fetch(
            `${NOMINATIM_API_URL}?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=${locale}&viewbox=${viewbox}`,
            { signal }
          )
            .then(res => res.json())
            .catch(error => {
              console.error('Failed to fetch location data:', error);
              return [];
            }),
          fetch(advancedSearchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              entity: ADVANCED_SEARCH_TYPES.ENTRANCES,
              matchAllFields: false,
              page: 0,
              size: 5
            }),
            signal
          })
            .then(res => res.json())
            .then(data => data.results || [])
            .catch(error => {
              console.error('Failed to fetch entrance data:', error);
              return [];
            }),
          fetch(advancedSearchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              entity: ADVANCED_SEARCH_TYPES.CAVES,
              matchAllFields: false,
              page: 0,
              size: 3
            }),
            signal
          })
            .then(res => res.json())
            .then(data => data.results || [])
            .then(caves =>
              // Networks have no coordinates: fetch each cave detail to get the first entrance's location
              // and filter to only keep real networks (multiple entrances).
              // 1 search call + up to 3 detail fetches = 4 API calls for this section.
              Promise.all(
                caves.map(cave =>
                  fetch(`${getCaveUrl}${cave.id}`, { signal })
                    .then(res => res.json())
                    .then(detail => {
                      const entrances = detail.entrances || [];
                      if (entrances.length < 2) return null;
                      const entrance = entrances[0];
                      return entrance
                        ? { ...cave, latitude: entrance.latitude, longitude: entrance.longitude }
                        : null;
                    })
                    .catch(() => null)
                )
              ).then(results => results.filter(Boolean))
            )
            .catch(error => {
              console.error('Failed to fetch network data:', error);
              return [];
            }),
          fetch(advancedSearchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              entity: ADVANCED_SEARCH_TYPES.ORGANIZATIONS,
              matchAllFields: false,
              page: 0,
              size: 3
            }),
            signal
          })
            .then(res => res.json())
            .then(data => data.results || [])
            .catch(error => {
              console.error('Failed to fetch organization data:', error);
              return [];
            })
        ]);

        // Don't write stale results if this request was superseded
        if (signal.aborted) return;

        const sortedLocations = locationData.sort((a, b) =>
            (ADDRESS_TYPE_PRIORITY[a.addresstype] || 99) - (ADDRESS_TYPE_PRIORITY[b.addresstype] || 99)
        );

        setLocationResults(sortedLocations);
        setEntranceResults(entranceData);
        setNetworkResults(networkData);
        setOrganizationResults(organizationData);
      } catch (error) {
        if (signal.aborted) return;
        console.error('Search error:', error);
        setLocationResults([]);
        setEntranceResults([]);
        setNetworkResults([]);
        setOrganizationResults([]);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }, AUTOCOMPLETE_DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timer);
      controller.abort();
      setLoading(false);
    };
  }, [query, locale, map]);

  const handleSelect = result => {
    setQuery('');
    setLocationResults([]);
    setEntranceResults([]);
    setNetworkResults([]);
    setOrganizationResults([]);

    if (result.resultType === 'entrance' || result.resultType === 'network' || result.resultType === 'organization') {
      const lat = result.latitude;
      const lng = result.longitude;

      // Store the selected marker for popup opening via layeradd listener
      setSelectedEntrance({ lat, lng });

      if (onLocationSelect) {
        onLocationSelect({ lat, lng });
      }

      // 150ms: let React flush the state updates (clearing query/results) before
      // triggering the map animation, so the dropdown closes before the view moves.
      setTimeout(() => {
        const targetZoom = 16;

        // setView triggers moveend/zoomend natively which MapClusters listens to.
        // When zoom doesn't change, force a dragend so markers reload for the new bounds.
        const needsDragEnd = map.getZoom() === targetZoom;
        map.setView([lat, lng], targetZoom);
        if (needsDragEnd) {
          map.fire('dragend');
        }
        if (result.resultType === 'organization' && onOrganizationSelect) {
          onOrganizationSelect();
        }
      }, 150);
    } else {
      // For locations: use existing bounding box logic
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      if (onLocationSelect) {
        onLocationSelect({ lat, lng });
      }

      // 100ms: shorter than the entrance case (no marker popup to wait for),
      // just enough for React to flush state before Leaflet animates.
      setTimeout(() => {
        if (result.boundingbox) {
          const [south, north, west, east] = result.boundingbox.map(parseFloat);
          map.fitBounds([[south, west], [north, east]]);
        } else {
          map.setView([lat, lng], map.getZoom());
        }
      }, 100);
    }
  };

  const allResults = useMemo(() => [
    ...entranceResults
      // Explicitly filter out entrances without coordinates to avoid showing results that can't be displayed on the map
      .filter(e => e.latitude != null && e.longitude != null)
      .map(e => ({ ...e, resultType: 'entrance' })),
    ...networkResults
      .filter(c => c.latitude != null && c.longitude != null)
      .map(c => ({ ...c, resultType: 'network' })),
    ...organizationResults
      .filter(o => o.latitude != null && o.longitude != null)
      .map(o => ({ ...o, resultType: 'organization' })),
    ...locationResults.map(l => ({ ...l, resultType: 'location' }))
  ], [entranceResults, networkResults, organizationResults, locationResults]);

  return (
    <SearchContainer elevation={3}>
      <TextField
        size="small"
        fullWidth
        placeholder={formatMessage({ id: 'Search on map...' })}
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
      {allResults.length > 0 && (
        <ResultsList className="results-list">
          {allResults.map(result => {
            if (result.resultType === 'entrance') {
              return (
                <StyledListItem
                  key={`entrance-${result.id}`}
                  onClick={() => handleSelect(result)}>
                  <ListItemAvatar>
                    <CustomIcon type="entrance" size={28} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={result.name}
                    secondary={[
                      [result.city, result.region].filter(Boolean).join(', '),
                      [
                        (result.cave?.depth || result.depth) && `↕ ${result.cave?.depth || result.depth}m`,
                        (result.cave?.length || result.length) && `↔ ${result.cave?.length || result.length}m`
                      ].filter(Boolean).join(' ')
                    ].filter(Boolean).join(' • ')}
                  />
                </StyledListItem>
              );
            }
            if (result.resultType === 'network') {
              return (
                <StyledListItem
                  key={`network-${result.id}`}
                  onClick={() => handleSelect(result)}>
                  <ListItemAvatar>
                    <CustomIcon type="network" size={28} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={result.name}
                    secondary={formatMessage({ id: 'Network' })}
                  />
                </StyledListItem>
              );
            }
            if (result.resultType === 'organization') {
              return (
                <StyledListItem
                  key={`organization-${result.id}`}
                  onClick={() => handleSelect(result)}>
                  <ListItemAvatar>
                    <CustomIcon type="organization" size={28} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={result.name}
                    secondary={formatMessage({ id: 'Organization' })}
                  />
                </StyledListItem>
              );
            }
            return (
              <StyledListItem
                key={result.place_id}
                onClick={() => handleSelect(result)}>
                <ListItemAvatar>
                  <LocationOn color="action" sx={{ fontSize: 28 }} />
                </ListItemAvatar>
                <ListItemText
                  primary={result.display_name}
                  secondary={formatMessage({ id: `addresstype.${result.addresstype}`, defaultMessage: result.addresstype })}
                />
              </StyledListItem>
            );
          })}
        </ResultsList>
      )}
    </SearchContainer>
  );
};

GeocodingControl.propTypes = {
  onLocationSelect: PropTypes.func,
  onOrganizationSelect: PropTypes.func
};

export default GeocodingControl;
