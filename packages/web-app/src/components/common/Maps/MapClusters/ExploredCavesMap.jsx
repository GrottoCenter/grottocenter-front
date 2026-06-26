import React from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton } from '@mui/material';
import { isMobile } from 'react-device-detect';
import CustomMapContainer from '../common/MapContainer';
import ExploredOverlay from './ExploredOverlay';
import useExploredCaves from './useExploredCaves';

const ExploredCavesMapInner = ({ points }) => (
  <ExploredOverlay points={points} shouldFitMapBound />
);

ExploredCavesMapInner.propTypes = {
  points: PropTypes.array.isRequired
};

/**
 * Standalone map showing a user's explored caves as green pins.
 * Reusable on any page with a userId (Account, Person profile, …).
 * Auto-fits bounds to the explored points on first load.
 * Renders nothing if the user has no explored caves.
 */
const ExploredCavesMap = ({ userId }) => {
  const { points, hasExploredData } = useExploredCaves({
    userId,
    enabled: true
  });

  if (!userId) return null;
  if (hasExploredData === null) {
    return (
      <Skeleton
        variant="rectangular"
        height={400}
        sx={{ mb: 2, borderRadius: 1 }}
      />
    );
  }
  if (hasExploredData === false) return null;

  return (
    <Box sx={{ mt: -3, mb: 3 }}>
      <CustomMapContainer
        wholePage={false}
        dragging={!isMobile}
        scrollWheelZoom={false}>
        <ExploredCavesMapInner points={points} />
      </CustomMapContainer>
    </Box>
  );
};

ExploredCavesMap.propTypes = {
  userId: PropTypes.number
};

export default ExploredCavesMap;
