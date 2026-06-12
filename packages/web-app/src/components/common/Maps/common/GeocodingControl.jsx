import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { styled } from '@mui/material/styles';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  InputAdornment,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { LocationOn, MyLocation } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  NOMINATIM_API_URL,
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  AUTOCOMPLETE_MIN_CHARACTERS,
  ADVANCED_SEARCH_TYPES
} from '../../../../conf/config';
import {
  advancedSearchUrl,
  getCaveUrl,
  getMassifUrl,
  getStatisticsMassifUrl
} from '../../../../conf/apiRoutes';
import CustomIcon from '../../CustomIcon';
import useRenderPopup from './Markers/useRenderPopup';
import {
  parseCoordinateString,
  formatWGS84
} from '../../../../helpers/coordinateConvert';
import useProjections from '../../../../hooks/useProjections';
import {
  CoordinatesMarker,
  EntrancePopup,
  MassifPopup,
  NetworkPopup,
  OrganizationPopup
} from './Markers/Components';

const SearchContainer = styled('div')`
  position: absolute;
  top: 10px;
  left: 50px;
  z-index: 1000;
  padding: 4px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65);
  /* Start compact, expand to fill available space on focus/results */
  width: 250px;
  max-width: calc(100% - 115px);
  transition: width 0.25s ease;

  &:focus-within {
    width: calc(100% - 115px);
  }

  @media (min-width: 1024px) {
    width: 350px;
    max-width: calc(100% - 200px);
  }

  .MuiAutocomplete-inputRoot {
    height: 32px;
    padding: 0 8px !important;
    align-items: center;

    input {
      padding: 0 4px;
    }

    .MuiInputAdornment-root {
      &.MuiInputAdornment-positionStart:not(.MuiInputAdornment-hiddenLabel) {
        margin-top: 0;
      }
    }
  }
`;

const OptionItem = styled(ListItem)`
  padding: 0 12px !important;
`;

const OptionIcon = styled(ListItemIcon)`
  min-width: auto;
  margin-right: 6px;
`;

const OptionText = styled(ListItemText)`
  margin: 1px;

  .MuiListItemText-primary {
    font-size: 1.6rem;
    line-height: 1.3;
  }
  .MuiListItemText-secondary {
    font-size: 1.2rem;
    line-height: 1.2;
  }
`;

const EMPTY_RESULTS = {
  location: [],
  entrance: [],
  network: [],
  organization: [],
  massif: []
};

const fetchAdvancedSearch = (query, entity, size, signal) =>
  fetch(advancedSearchUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      entity,
      matchAllFields: false,
      page: 0,
      size
    }),
    signal
  })
    .then(res => res.json())
    .then(data => data.results || []);

const ADDRESS_TYPE_PRIORITY = {
  house: 1,
  building: 2,
  amenity: 3,
  tourism: 4,
  leisure: 5,
  road: 6,
  highway: 7,
  hamlet: 8,
  village: 9,
  suburb: 10,
  neighbourhood: 11,
  quarter: 12,
  town: 13,
  city: 14,
  municipality: 15,
  county: 16,
  district: 17,
  state: 18,
  province: 19,
  region: 20,
  country: 21,
  continent: 22
};

const GeocodingControl = ({ onLocationSelect }) => {
  const map = useMap();
  const { formatMessage, locale } = useIntl();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [coordinateResult, setCoordinateResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const popupCleanupRef = useRef(null);
  const markerCleanupRef = useRef(null);
  const renderPopup = useRenderPopup();
  const projections = useProjections();

  // Cleanup any pending popup/marker operation on unmount
  useEffect(
    () => () => {
      popupCleanupRef.current?.();
      markerCleanupRef.current?.();
    },
    []
  );

  // Open the result's popup at its coordinates once the map has finished moving.
  // Note that is NOT the marker pop content, because the marker may not exist or is not displayed
  // doing this improve UX (popup appears immediately with the animation,
  // instead of waiting for the marker to load and its popupopen event)
  const schedulePopup = (lat, lng, result) => {
    popupCleanupRef.current?.();
    const onMoveEnd = () => {
      popupCleanupRef.current = null;
      let content;
      if (result.resultType === 'entrance')
        content = renderPopup(
          <EntrancePopup
            entrance={{
              ...result,
              depth: result.depth ?? result.cave?.depth,
              length: result.length ?? result.cave?.length,
              caveName: result.caveName ?? result.cave?.name,
              caveId: result.caveId ?? result.cave?.id
            }}
          />
        );
      else if (result.resultType === 'network')
        content = renderPopup(<NetworkPopup network={result} />);
      else if (result.resultType === 'massif')
        content = renderPopup(<MassifPopup massif={result} />);
      else content = renderPopup(<OrganizationPopup organization={result} />);
      map.openPopup(content, [lat, lng]);
    };
    map.once('moveend', onMoveEnd);
    popupCleanupRef.current = () => map.off('moveend', onMoveEnd);
  };

  useEffect(() => {
    const parsed = parseCoordinateString(query, projections);
    if (parsed) {
      setResults(EMPTY_RESULTS);
      setCoordinateResult(parsed);
      setLoading(false);
      return undefined;
    }
    setCoordinateResult(null);

    if (query.length < AUTOCOMPLETE_MIN_CHARACTERS) {
      setResults(EMPTY_RESULTS);
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
        const [
          locationData,
          entranceData,
          networkData,
          organizationData,
          massifData
        ] = await Promise.all([
          fetch(
            `${NOMINATIM_API_URL}?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=${locale}&viewbox=${viewbox}`,
            { signal }
          )
            .then(res => res.json())
            .catch(error => {
              if (error.name !== 'AbortError')
                console.error('Failed to fetch location data:', error);
              return [];
            }),
          fetchAdvancedSearch(
            query,
            ADVANCED_SEARCH_TYPES.ENTRANCES,
            5,
            signal
          ).catch(error => {
            if (error.name !== 'AbortError')
              console.error('Failed to fetch entrance data:', error);
            return [];
          }),
          fetchAdvancedSearch(query, ADVANCED_SEARCH_TYPES.CAVES, 3, signal)
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
                        ? {
                            ...cave,
                            latitude: entrance.latitude,
                            longitude: entrance.longitude
                          }
                        : null;
                    })
                    .catch(() => null)
                )
              ).then(r => r.filter(Boolean))
            )
            .catch(error => {
              if (error.name !== 'AbortError')
                console.error('Failed to fetch network data:', error);
              return [];
            }),
          fetchAdvancedSearch(
            query,
            ADVANCED_SEARCH_TYPES.ORGANIZATIONS,
            3,
            signal
          ).catch(error => {
            if (error.name !== 'AbortError')
              console.error('Failed to fetch organization data:', error);
            return [];
          }),
          fetchAdvancedSearch(query, ADVANCED_SEARCH_TYPES.MASSIFS, 3, signal)
            .then(massifs =>
              // Massifs have no coordinates: fetch detail (polygon → bounds) and statistics
              // (counts) in parallel. Statistics failure is non-fatal: counts fall back to 0.
              Promise.all(
                massifs.map(massif =>
                  Promise.all([
                    fetch(`${getMassifUrl}${massif.id}`, { signal }).then(res => res.json()),
                    fetch(getStatisticsMassifUrl(massif.id), { signal })
                      .then(res => res.json())
                      .catch(() => null)
                  ])
                    .then(([detail, stats]) => {
                      if (!detail.geogPolygon) return null;
                      const geoJson =
                        typeof detail.geogPolygon === 'string'
                          ? JSON.parse(detail.geogPolygon)
                          : detail.geogPolygon;
                      const massifBounds = L.geoJSON(geoJson).getBounds();
                      if (!massifBounds.isValid()) return null;
                      const center = massifBounds.getCenter();
                      const sw = massifBounds.getSouthWest();
                      const ne = massifBounds.getNorthEast();
                      return {
                        ...massif,
                        latitude: center.lat,
                        longitude: center.lng,
                        bounds: [
                          [sw.lat, sw.lng],
                          [ne.lat, ne.lng]
                        ],
                        entranceCount: stats?.nb_caves ?? 0,
                        networkCount: stats?.nb_networks ?? 0
                      };
                    })
                    .catch(() => null)
                )
              ).then(r => r.filter(Boolean))
            )
            .catch(error => {
              if (error.name !== 'AbortError')
                console.error('Failed to fetch massif data:', error);
              return [];
            })
        ]);

        // Don't write stale results if this request was superseded
        if (signal.aborted) return;

        setResults({
          location: locationData.sort(
            (a, b) =>
              (ADDRESS_TYPE_PRIORITY[a.addresstype] || 99) -
              (ADDRESS_TYPE_PRIORITY[b.addresstype] || 99)
          ),
          entrance: entranceData,
          network: networkData,
          organization: organizationData,
          massif: massifData
        });
      } catch (error) {
        if (signal.aborted) return;
        console.error('Search error:', error);
        setResults(EMPTY_RESULTS);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }, AUTOCOMPLETE_DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timer);
      controller.abort();
      setLoading(false);
    };
  }, [query, locale, map, projections]);

  const handleSelect = result => {
    document.activeElement?.blur();
    setQuery('');
    setResults(EMPTY_RESULTS);
    setCoordinateResult(null);

    if (result.resultType === 'coordinates') {
      const { latitude: lat, longitude: lng } = result;
      if (onLocationSelect) onLocationSelect({ lat, lng });
      markerCleanupRef.current?.();
      setTimeout(() => {
        map.setView([lat, lng], 16);
        const marker = L.marker([lat, lng], {
          icon: CoordinatesMarker
        }).addTo(map);
        const timer = setTimeout(() => {
          marker.remove();
          markerCleanupRef.current = null;
        }, 4000);
        markerCleanupRef.current = () => {
          clearTimeout(timer);
          marker.remove();
          markerCleanupRef.current = null;
        };
      }, 150);
      return;
    }

    if (result.resultType === 'massif') {
      const lat = result.latitude;
      const lng = result.longitude;
      if (onLocationSelect) onLocationSelect({ lat, lng });
      setTimeout(() => {
        schedulePopup(lat, lng, result);
        map.fitBounds(result.bounds);
      }, 150);
    } else if (
      result.resultType === 'entrance' ||
      result.resultType === 'network' ||
      result.resultType === 'organization'
    ) {
      const lat = result.latitude;
      const lng = result.longitude;

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
        schedulePopup(lat, lng, result);
        map.setView([lat, lng], targetZoom);
        if (needsDragEnd) {
          map.fire('dragend');
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
          map.fitBounds([
            [south, west],
            [north, east]
          ]);
        } else {
          map.setView([lat, lng], map.getZoom());
        }
      }, 100);
    }
  };

  const allResults = useMemo(
    () => [
      ...(coordinateResult
        ? [
            {
              resultType: 'coordinates',
              latitude: coordinateResult.lat,
              longitude: coordinateResult.lng,
              format: coordinateResult.format,
              id: 'coords-result',
              name: formatWGS84(coordinateResult.lat, coordinateResult.lng, 4)
            }
          ]
        : []),
      // Explicitly filter out entrances without coordinates to avoid showing results that can't be displayed on the map
      ...results.entrance
        .filter(e => e.latitude != null && e.longitude != null)
        .map(e => ({ ...e, resultType: 'entrance' })),
      ...results.network
        .filter(c => c.latitude != null && c.longitude != null)
        .map(c => ({ ...c, resultType: 'network' })),
      ...results.massif.map(m => ({ ...m, resultType: 'massif' })),
      ...results.organization
        .filter(o => o.latitude != null && o.longitude != null)
        .map(o => ({ ...o, resultType: 'organization' })),
      ...results.location.map(l => ({ ...l, resultType: 'location' }))
    ],
    [results, coordinateResult]
  );

  const showDropdown =
    isOpen &&
    (allResults.length > 0 ||
      (!loading && query.length >= AUTOCOMPLETE_MIN_CHARACTERS));

  return (
    <SearchContainer>
      <Autocomplete
        open={showDropdown}
        onClose={() => setIsOpen(false)}
        value={null}
        options={allResults}
        loading={loading}
        filterOptions={x => x}
        forcePopupIcon={false}
        getOptionLabel={r => r.name || r.display_name || ''}
        isOptionEqualToValue={(o, v) =>
          o.resultType === v?.resultType &&
          (o.id ?? o.place_id) === (v?.id ?? v?.place_id)
        }
        inputValue={query}
        onInputChange={(_, val, reason) => {
          // Skip 'reset': handleSelect already calls setQuery('') on selection
          if (reason !== 'reset') setQuery(val);
        }}
        onChange={(_, result) => result && handleSelect(result)}
        noOptionsText={formatMessage({
          id: 'No results',
          defaultMessage: 'No results'
        })}
        renderOption={(props, result) => {
          const { key: _key, ...optionProps } = props;

          let icon;
          let primary;
          let secondary;

          if (result.resultType === 'coordinates') {
            icon = <MyLocation color="action" sx={{ fontSize: 28 }} />;
            primary = formatWGS84(result.latitude, result.longitude, 4);
            secondary = formatMessage({
              id: `coordinates.format.${result.format}`,
              defaultMessage: result.format
            });
          } else if (result.resultType === 'entrance') {
            icon = <CustomIcon type="entrance" size={28} />;
            primary = result.name;
            secondary = [
              [result.city, result.region].filter(Boolean).join(', '),
              [
                (result.cave?.depth || result.depth) &&
                  `↕ ${result.cave?.depth || result.depth}m`,
                (result.cave?.length || result.length) &&
                  `↔ ${result.cave?.length || result.length}m`
              ]
                .filter(Boolean)
                .join(' ')
            ]
              .filter(Boolean)
              .join(' • ');
          } else if (result.resultType === 'network') {
            icon = <CustomIcon type="network" size={28} />;
            primary = result.name;
            secondary = formatMessage({ id: 'Network' });
          } else if (result.resultType === 'massif') {
            icon = <CustomIcon type="massif" size={28} />;
            primary = result.name;
            secondary = formatMessage({ id: 'Massif' });
          } else if (result.resultType === 'organization') {
            icon = <CustomIcon type="organization" size={28} />;
            primary = result.name;
            secondary = formatMessage({ id: 'Organization' });
          } else {
            icon = <LocationOn color="action" sx={{ fontSize: 28 }} />;
            primary = result.display_name;
            secondary = formatMessage({
              id: `addresstype.${result.addresstype}`,
              defaultMessage: result.addresstype
            });
          }

          return (
            <OptionItem
              key={`${result.resultType ?? 'place'}-${result.id ?? result.place_id}`}
              {...optionProps}
              dense>
              <OptionIcon>{icon}</OptionIcon>
              <OptionText
                primary={primary}
                secondary={secondary || undefined}
              />
            </OptionItem>
          );
        }}
        slotProps={{
          listbox: {
            className: 'results-list',
            style: { maxHeight: 200, padding: 0 }
          }
        }}
        renderInput={params => (
          <TextField
            {...params}
            size="small"
            fullWidth
            placeholder={formatMessage({ id: 'Search on map...' })}
            onFocus={() => setIsOpen(true)}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: loading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : (
                  params.InputProps.endAdornment
                )
              },
              htmlInput: {
                ...params.inputProps,
                'aria-label': formatMessage({ id: 'Search on map...' }),
                'aria-busy': loading
              }
            }}
          />
        )}
      />
    </SearchContainer>
  );
};

GeocodingControl.propTypes = {
  onLocationSelect: PropTypes.func
};

export default GeocodingControl;
