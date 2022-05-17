import React, { useState, createContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { pipe, reject, isNil, map, prop } from 'ramda';

import { detailsType as entranceDetailsType } from '../Entry/Provider';

const date = new Date();
const todayDate = date.toISOString().substring(0, 10);

export const getPositions = pipe(
  map(entrance => [prop('latitude', entrance), prop('longitude', entrance)]),
  reject(isNil)
);

const defaultContext = {
  state: {
    cave: {
      id: 0,
      name: '',
      localisation: '',
      depth: 0,
      development: 0,
      interestRate: 0,
      progressionRate: 0,
      accessRate: 0,
      author: '',
      creationDate: todayDate
    },
    coordinates: null,
    entrances: null
  }
};

export const CaveContext = createContext(defaultContext);

const Provider = ({ data, loading = true, children }) => {
  const { entrances, ...caveData } = data;
  const [caveState, setCaveState] = useState(caveData || null);
  const [coordinatesState, setCoordinatesState] = useState(
    getPositions(entrances)
  );
  const [entrancesState, setEntrancesState] = useState(entrances || null);
  const [selectedEntrances, setSelectedEntrances] = useState([]);

  useEffect(() => {
    setCaveState(caveData);
    setEntrancesState(entrances || null);
    setCoordinatesState(getPositions(entrances));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const onSelectEntrance = selection => {
    if (!isNil(selection)) {
      setSelectedEntrances(selection);
    }
  };

  const handleOpenEntranceMap = entranceId => {
    if (!isNil(entranceId)) {
      // TODO
      window.open(`/ui/map`, '_blank');
    }
  };
  const handleOpenEntranceDescription = entranceId => {
    if (!isNil(entranceId)) {
      window.open(`/ui/entrances/${entranceId}`, '_blank');
    }
  };

  return (
    <CaveContext.Provider
      value={{
        state: {
          loading,
          cave: caveState,
          coordinates: coordinatesState,
          entrances: entrancesState,
          selectedEntrances
        },
        action: {
          onSelectEntrance,
          openEntranceMap: handleOpenEntranceMap,
          openEntranceDescription: handleOpenEntranceDescription
        }
      }}>
      {children}
    </CaveContext.Provider>
  );
};

export const caveTypes = PropTypes.shape({
  accessRate: PropTypes.number,
  altitude: PropTypes.number,
  author: PropTypes.string,
  creationDate: PropTypes.string,
  depth: PropTypes.number,
  development: PropTypes.number,
  discoveryYear: PropTypes.number,
  editionDate: PropTypes.string,
  entrances: PropTypes.arrayOf(entranceDetailsType),
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  interestRate: PropTypes.number,
  isDivingCave: PropTypes.bool,
  lastEditor: PropTypes.string,
  localisation: PropTypes.string,
  mountain: PropTypes.string,
  name: PropTypes.string,
  progressionRate: PropTypes.number,
  temperature: PropTypes.number,
  undergroundType: PropTypes.string
});

Provider.propTypes = {
  data: caveTypes.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default Provider;
