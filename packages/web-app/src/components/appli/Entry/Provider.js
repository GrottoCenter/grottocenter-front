import React, { useState, createContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { all, allPass, equals, is, length, pathOr, pipe } from 'ramda';

const date = new Date();
const todayDate = date.toISOString().substring(0, 10);
const defaultContext = {
  state: {
    entryId: '',
    details: {
      id: 0,
      name: 'Cavitée',
      localisation: 'France',
      depth: 100,
      development: 100,
      interestRate: 2.5,
      progressionRate: 2.5,
      accessRate: 2.5,
      author: 'Author name',
      creationDate: todayDate
    },
    descriptions: [],
    riggings: [],
    comments: [],
    position: [51.505, -0.09]
  }
};

const isPair = pipe(length, equals(2));
export const isValidCoordinates = allPass([is(Array), all(is(Number)), isPair]);

export const EntryContext = createContext(defaultContext);

const Entry = ({
  details,
  comments,
  descriptions,
  riggings,
  entryId,
  loading = true,
  children
}) => {
  const [detailsState, setState] = useState(defaultContext.state.details);

  useEffect(() => {
    setState({
      name: pathOr('Name', ['name'], details),
      localisation: pathOr('Localisation', ['localisation'], details),
      depth: pathOr(0, ['depth'], details),
      development: pathOr(0, ['development'], details),
      interestRate: pathOr(0, ['interestRate'], details),
      progressionRate: pathOr(0, ['progressionRate'], details),
      accessRate: pathOr(0, ['accessRate'], details),
      author: pathOr('Author', ['author'], details),
      creationDate: pathOr(todayDate, ['creationDate'], details),
      coordinates: pathOr([0, 0], ['coordinates'], details),
      ...details
    });
  }, [details]);

  return (
    <EntryContext.Provider
      value={{
        state: {
          entryId,
          loading,
          details: detailsState,
          comments,
          descriptions,
          riggings,
          position: pathOr(null, ['coordinates'], details)
        },
        action: {}
      }}>
      {children}
    </EntryContext.Provider>
  );
};

const authorType = PropTypes.shape({
  name: PropTypes.string
});
export const detailsType = PropTypes.shape({
  accessRate: PropTypes.number,
  altitude: PropTypes.number,
  author: authorType,
  coordinates: PropTypes.arrayOf(PropTypes.number),
  creationDate: PropTypes.string,
  depth: PropTypes.number,
  development: PropTypes.number,
  discoveryYear: PropTypes.number,
  editionDate: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  interestRate: PropTypes.number,
  isDivingCave: PropTypes.bool,
  lastEditor: PropTypes.string,
  localisation: PropTypes.string,
  mountain: PropTypes.string,
  name: PropTypes.string,
  progressionRate: PropTypes.number,
  undergroundType: PropTypes.string
});

export const commentType = PropTypes.shape({
  accessRate: PropTypes.number,
  author: authorType,
  body: PropTypes.string,
  date: PropTypes.string,
  id: PropTypes.number,
  interestRate: PropTypes.number,
  language: PropTypes.string,
  progressionRate: PropTypes.number,
  title: PropTypes.string
});

export const commentsType = PropTypes.arrayOf(
  PropTypes.shape({
    accessRate: PropTypes.number,
    author: authorType,
    body: PropTypes.string,
    date: PropTypes.string,
    id: PropTypes.number,
    interestRate: PropTypes.number,
    language: PropTypes.string,
    progressionRate: PropTypes.number,
    title: PropTypes.string
  })
);

export const descriptionsType = PropTypes.arrayOf(
  PropTypes.shape({
    author: authorType,
    body: PropTypes.string,
    date: PropTypes.string,
    id: PropTypes.number,
    language: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  })
);

const obstacleType = PropTypes.shape({
  obstacle: PropTypes.string,
  rope: PropTypes.string,
  observation: PropTypes.string,
  anchor: PropTypes.string
});

export const riggingType = PropTypes.shape({
  obstacles: PropTypes.arrayOf(obstacleType),
  author: authorType,
  id: PropTypes.number,
  language: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
});

export const riggingsType = PropTypes.arrayOf(riggingType);

export const positionType = PropTypes.arrayOf(PropTypes.number);

Entry.propTypes = {
  children: PropTypes.node.isRequired,
  comments: commentsType.isRequired,
  descriptions: descriptionsType.isRequired,
  details: detailsType.isRequired,
  loading: PropTypes.bool,
  riggings: riggingsType.isRequired,
  entryId: PropTypes.string.isRequired
};

export default Entry;
