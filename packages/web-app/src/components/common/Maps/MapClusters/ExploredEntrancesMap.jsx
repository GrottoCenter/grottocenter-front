import React from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton } from '@mui/material';
import { isMobile } from 'react-device-detect';
import CustomMapContainer from '../common/MapContainer';
import ExploredOverlay from './ExploredOverlay';
import useExploredEntrances from './useExploredEntrances';

const ExploredEntrancesMapInner = ({ points }) => (
  <ExploredOverlay points={points} shouldFitMapBound />
);

ExploredEntrancesMapInner.propTypes = {
  points: PropTypes.array.isRequired
};

/**
 * Standalone map showing a user's explored entrances as green pins.
 * Reusable on any page with a userId (Account, Person profile, …).
 * Auto-fits bounds to the explored points on first load.
 * Renders nothing if the user has no explored entrances.
 */
const ExploredEntrancesMap = ({ userId }) => {
  const { points, hasExploredData } = useExploredEntrances({
    userId,
    enabled: true
  });

  if (!userId) return null;
  if (hasExploredData === null) {
    return (
      <Skeleton
        variant="rectangular"
        height={400}
        sx={{ mb: 3, borderRadius: 1 }}
      />
    );
  }
  if (hasExploredData === false) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <CustomMapContainer
        wholePage={false}
        dragging={!isMobile}
        scrollWheelZoom={false}>
        <ExploredEntrancesMapInner points={points} />
      </CustomMapContainer>
    </Box>
  );
};

ExploredEntrancesMap.propTypes = {
  userId: PropTypes.number
};

export default ExploredEntrancesMap;
