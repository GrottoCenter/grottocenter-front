import React, { useContext } from 'react';
import { isNil, isEmpty, pipe, filter, includes } from 'ramda';

import Map from '../../common/Maps/MapMultipleMarkers';
import { CaveContext, getPositions } from './Provider';

const isSelected = selection => entrance => includes(entrance.id, selection);

const EntrancesMap = () => {
  const {
    state: { coordinates, loading, selectedEntrances, entrances }
  } = useContext(CaveContext);

  const getPositionsToDisplay = () => {
    if (isNil(selectedEntrances) || isEmpty(selectedEntrances)) {
      return coordinates;
    }
    return pipe(filter(isSelected(selectedEntrances)), getPositions)(entrances);
  };

  return <Map positions={getPositionsToDisplay()} loading={loading} />;
};

export default EntrancesMap;
