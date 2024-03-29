import React, { useMemo, useState, createContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { pipe, reject, isNil, map, prop } from 'ramda';

import { detailsType as entranceDetailsType } from '../Entry/Provider';
import authorType from '../../../types/author.type';

const date = new Date();
const todayDate = date.toISOString().substring(0, 10);

export const getPositions = pipe(
  map(entrance => [prop('latitude', entrance), prop('longitude', entrance)]),
  reject(isNil)
);

const defaultContext = {
  state: {
    cave: {
      author: null,
      creationDate: todayDate,
      depth: 0,
      descriptions: null,
      development: 0,
      id: 0,
      localisation: '',
      name: ''
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

  const contextValue = useMemo(
    () => ({
      state: {
        loading,
        cave: caveState,
        coordinates: coordinatesState,
        entrances: entrancesState,
        selectedEntrances
      },
      action: {
        onSelectEntrance
      }
    }),
    [caveState, coordinatesState, entrancesState, loading, selectedEntrances]
  );

  return (
    <CaveContext.Provider value={contextValue}>{children}</CaveContext.Provider>
  );
};

export const caveTypes = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  author: authorType,
  reviewer: authorType,
  name: PropTypes.string,
  creationDate: PropTypes.string,
  reviewedDate: PropTypes.string,
  depth: PropTypes.number,
  length: PropTypes.number,
  altitude: PropTypes.number,
  temperature: PropTypes.number,
  isDivingCave: PropTypes.bool,
  entrances: PropTypes.arrayOf(entranceDetailsType),
  massif: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })
});

export const descriptionsType = PropTypes.arrayOf(
  PropTypes.shape({
    author: authorType,
    body: PropTypes.string,
    date: PropTypes.instanceOf(Date),
    id: PropTypes.number,
    language: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  })
);

Provider.propTypes = {
  data: caveTypes.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default Provider;
