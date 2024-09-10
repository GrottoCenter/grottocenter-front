import React from 'react';
import PropTypes from 'prop-types';

import Map from '../../common/Maps/MapMultipleMarkers';
import idNameType from '../../../types/idName.type';

const EntrancesMap = ({ isLoading, entrances, selectedEntrancesId = [] }) => {
  const getPositionsToDisplay = () => {
    if (selectedEntrancesId.length > 0)
      return entrances.filter(e => selectedEntrancesId.includes(e.id));

    return entrances;
  };

  return <Map positions={getPositionsToDisplay()} loading={isLoading} />;
};

EntrancesMap.propTypes = {
  isLoading: PropTypes.bool,
  entrances: PropTypes.arrayOf(idNameType),
  selectedEntrancesId: PropTypes.arrayOf(PropTypes.number)
};

export default EntrancesMap;
