import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  formatCoordinatesForCopy,
  formatWGS84
} from '../../../helpers/coordinateConvert';
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import {
  ContentCopy,
  Map as MapIcon,
  OpenInNew,
  Place,
  TravelExplore,
  Tune
} from '@mui/icons-material';
import copyToClipboard from '../../../helpers/clipboard';
import CRSMenu from '../CRSMenu';
import AppLink from '../AppLink';

import {
  useNotification,
  useCoordinatePreference,
  useProjections
} from '../../../hooks';

const GROTTOCENTER_LINK_ZOOM = 16;

// Precision is expressed in meters (lower = more accurate).
// error   : unknown (null/undefined), invalid (0), or imprecise (>= 100 m)
// warning : acceptable precision (99 m)
// success : good precision (< 20 m)
const computePrecisionSeverity = precision => {
  if (precision == null || precision === 0 || precision >= 100) return 'error';
  if (precision >= 20) return 'warning';
  return 'success';
};

const CoordinateDisplay = ({
  latitude,
  longitude,
  precision,
  showMapLinks = false,
  compact = false,
  entityType = null,
  entityId = null
}) => {
  const { formatMessage } = useIntl();
  const { onSuccess } = useNotification();

  const isTouch = useMediaQuery('(pointer: coarse)');

  const projections = useProjections();

  const [preferred, setPref] = useCoordinatePreference();
  const [formatMenuAnchor, setFormatMenuAnchor] = useState(null);
  const [mapLinksMenuAnchor, setMapLinksMenuAnchor] = useState(null);

  const handlePreferenceChange = useCallback(
    code => {
      setPref(code);
      setFormatMenuAnchor(null);
    },
    [setPref]
  );

  const displayValue = useMemo(() => {
    try {
      return (
        formatCoordinatesForCopy(latitude, longitude, preferred, projections) ??
        formatWGS84(latitude, longitude, 4)
      );
    } catch {
      return formatWGS84(latitude, longitude, 4);
    }
  }, [latitude, longitude, preferred, projections]);

  const handleCopy = useCallback(async () => {
    await copyToClipboard(displayValue);
    if (!isTouch) onSuccess(formatMessage({ id: 'Coordinates copied' }));
  }, [displayValue, isTouch, onSuccess, formatMessage]);

  const openOSM = () =>
    window.open(
      `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  const openGM = () =>
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  const grottoMapPopup =
    entityType && entityId ? `?entity=${entityType}:${entityId}` : '';
  const grottoMapUrl = `/ui/map/${latitude},${longitude},${GROTTOCENTER_LINK_ZOOM}${grottoMapPopup}`;

  const precisionSeverity = computePrecisionSeverity(precision);
  const precisionText =
    precision === 0
      ? formatMessage({
          id: 'Coordinates precision unavailable for restricted access entrance.'
        })
      : precision != null
        ? `±${precision}m`
        : null;

  if (compact) {
    return (
      <Box display="flex" alignItems="center">
        <Typography variant="body2">{displayValue}</Typography>
        <Tooltip title={formatMessage({ id: 'Copy coordinates' })}>
          <IconButton
            size="small"
            onClick={handleCopy}
            aria-label={formatMessage({ id: 'Copy coordinates' })}
            sx={{ color: 'text.secondary' }}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={formatMessage({ id: 'Change coordinate system' })}>
          <IconButton
            size="small"
            onClick={e => setFormatMenuAnchor(e.currentTarget)}
            aria-label={formatMessage({ id: 'Change coordinate system' })}
            sx={{ color: 'text.secondary' }}>
            <Tune fontSize="small" />
          </IconButton>
        </Tooltip>
        <CRSMenu
          anchorEl={formatMenuAnchor}
          onClose={() => setFormatMenuAnchor(null)}
          preferred={preferred}
          projections={projections}
          onSelect={handlePreferenceChange}
        />
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5}>
      <Typography variant="body1">{displayValue}</Typography>
      {precisionText && (
        <Chip
          label={precisionText}
          size="small"
          color={precisionSeverity}
          variant="outlined"
        />
      )}
      <Tooltip title={formatMessage({ id: 'Copy coordinates' })}>
        <IconButton
          size="small"
          onClick={handleCopy}
          aria-label={formatMessage({ id: 'Copy coordinates' })}
          sx={{ color: 'text.secondary' }}>
          <ContentCopy fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={formatMessage({ id: 'Change coordinate system' })}>
        <IconButton
          size="small"
          onClick={e => setFormatMenuAnchor(e.currentTarget)}
          aria-label={formatMessage({ id: 'Change coordinate system' })}
          sx={{ color: 'text.secondary' }}>
          <Tune fontSize="small" />
        </IconButton>
      </Tooltip>
      {showMapLinks && (
        <>
          <Tooltip title={formatMessage({ id: 'Open on map' })}>
            <IconButton
              size="small"
              onClick={e => setMapLinksMenuAnchor(e.currentTarget)}
              aria-label={formatMessage({ id: 'Open on map' })}
              sx={{ color: 'text.secondary' }}>
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={mapLinksMenuAnchor}
            open={Boolean(mapLinksMenuAnchor)}
            onClose={() => setMapLinksMenuAnchor(null)}>
            <MenuItem
              component={AppLink}
              to={grottoMapUrl}
              openInNewTabDesktop
              onClick={() => setMapLinksMenuAnchor(null)}>
              <ListItemIcon>
                <MapIcon />
              </ListItemIcon>
              <ListItemText primary="Grottocenter" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                openOSM();
                setMapLinksMenuAnchor(null);
              }}>
              <ListItemIcon>
                <TravelExplore />
              </ListItemIcon>
              <ListItemText primary="OpenStreetMap" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                openGM();
                setMapLinksMenuAnchor(null);
              }}>
              <ListItemIcon>
                <Place />
              </ListItemIcon>
              <ListItemText primary="Google Maps" />
            </MenuItem>
          </Menu>
        </>
      )}
      <CRSMenu
        anchorEl={formatMenuAnchor}
        onClose={() => setFormatMenuAnchor(null)}
        preferred={preferred}
        projections={projections}
        onSelect={handlePreferenceChange}
      />
    </Box>
  );
};

CoordinateDisplay.propTypes = {
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  precision: PropTypes.number,
  showMapLinks: PropTypes.bool,
  compact: PropTypes.bool,
  entityType: PropTypes.string,
  entityId: PropTypes.number
};

export default CoordinateDisplay;
