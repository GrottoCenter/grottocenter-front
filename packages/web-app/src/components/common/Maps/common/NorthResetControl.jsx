import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { useMap, useMapEvent } from 'react-leaflet';
import CustomControl from './CustomControl';
import CompassNeedle from './CompassNeedle';

const getBearing = map =>
  typeof map.getBearing === 'function' ? map.getBearing() : 0;

// Floating north indicator: appears whenever the map is left rotated but NOT
// actively following the compass (e.g. after detaching a heading-up follow with
// a pan). Tapping it straightens the map back to north. It hides while compass
// follow is on, since the location control's own needle already resets north
// there — and resetting while following would just snap straight back.
const NorthResetControl = () => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const map = useMap();
  const [bearing, setBearing] = useState(() => getBearing(map));
  const [following, setFollowing] = useState(false);

  useMapEvent('rotate', () => setBearing(getBearing(map)));
  useMapEvent('compassfollowchange', e => setFollowing(e.following));

  if (following || Math.round(bearing) % 360 === 0) return null;

  const label = formatMessage({ id: 'Reset to north' });
  return (
    <CustomControl position="bottomright" useLeafletControl>
      <Tooltip title={label} placement="left" arrow>
        <IconButton
          size="small"
          onClick={() => map.setBearing(0)}
          aria-label={label}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '4px',
            height: 44,
            width: 44,
            '&:hover': { bgcolor: '#f4f4f4' }
          }}>
          <CompassNeedle
            bearing={bearing}
            northColor={theme.palette.error.main}
            southColor={theme.palette.grey[500]}
          />
        </IconButton>
      </Tooltip>
    </CustomControl>
  );
};

export default NorthResetControl;
