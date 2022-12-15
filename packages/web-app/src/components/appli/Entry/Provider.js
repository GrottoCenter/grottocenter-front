import React, { useState, createContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { all, allPass, equals, is, length, pathOr, pipe } from 'ramda';
import { descriptionsType } from '../Descriptions/propTypes';
import authorType from '../../../types/author.type';
import idNameType from '../../../types/idName.type';

const date = new Date();
const todayDate = date.toISOString().substring(0, 10);
const defaultContext = {
  state: {
    details: {
      creationDate: todayDate,
      depth: 100,
      development: 100,
      id: 0,
      accessRate: 5,
      interest: 5,
      progression: 5,
      localisation: 'France',
      name: 'Cavité'
    },
    comments: [],
    descriptions: [],
    documents: [],
    histories: [],
    locations: [],
    position: [51.505, -0.09],
    riggings: []
  }
};

const isPair = pipe(length, equals(2));
export const isValidCoordinates = allPass([is(Array), all(is(Number)), isPair]);

export const EntryContext = createContext(defaultContext);

const Entry = ({
  details,
  comments,
  descriptions,
  documents,
  histories,
  locations,
  riggings,
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
      interest: pathOr(0, ['interest'], details),
      progression: pathOr(0, ['progression'], details),
      access: pathOr(0, ['access'], details),
      author: details?.author,
      creationDate: pathOr(todayDate, ['creationDate'], details),
      coordinates: pathOr([0, 0], ['coordinates'], details),
      ...details
    });
  }, [details]);

  const contextValue = useMemo(
    () => ({
      state: {
        loading,
        details: detailsState,
        comments,
        descriptions,
        documents,
        histories,
        locations,
        riggings,
        position: pathOr(null, ['coordinates'], details)
      },
      action: {}
    }),
    [
      comments,
      descriptions,
      details,
      detailsState,
      documents,
      histories,
      loading,
      locations,
      riggings
    ]
  );
  return (
    <EntryContext.Provider value={contextValue}>
      {children}
    </EntryContext.Provider>
  );
};

export const detailsType = PropTypes.shape({
  access: PropTypes.number,
  altitude: PropTypes.number,
  author: authorType,
  cave: idNameType,
  coordinates: PropTypes.arrayOf(PropTypes.number),
  country: PropTypes.string,
  creationDate: PropTypes.instanceOf(Date),
  depth: PropTypes.number,
  development: PropTypes.number,
  discoveryYear: PropTypes.number,
  editionDate: PropTypes.instanceOf(Date),
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  interest: PropTypes.number,
  isDivingCave: PropTypes.bool,
  isSensitive: PropTypes.bool,
  lastEditor: PropTypes.string,
  localisation: PropTypes.string,
  massif: idNameType,
  name: PropTypes.string,
  progression: PropTypes.number,
  temperature: PropTypes.number,
  undergroundType: PropTypes.string,
  language: PropTypes.string
});

export const commentType = PropTypes.shape({
  id: PropTypes.number,
  title: PropTypes.string,
  body: PropTypes.string,
  author: authorType.isRequired,
  reviewer: authorType,
  creationDate: PropTypes.instanceOf(Date),
  reviewedDate: PropTypes.instanceOf(Date),
  interest: PropTypes.number,
  progression: PropTypes.number,
  access: PropTypes.number,
  eTTrail: PropTypes.string, // hh:mm:ss
  eTUnderground: PropTypes.string, // hh:mm:ss
  language: PropTypes.string
});

export const commentsType = PropTypes.arrayOf(commentType);

export const documentType = PropTypes.shape({
  details: PropTypes.shape({
    documentType: PropTypes.string
  }),
  entities: PropTypes.shape({
    files: PropTypes.shape({
      fileNames: PropTypes.arrayOf(PropTypes.string),
      fileLinks: PropTypes.arrayOf(PropTypes.string)
    })
  }),
  id: PropTypes.number,
  overview: PropTypes.shape({
    license: PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired
    }),
    title: PropTypes.string.isRequired
  })
});

export const documentsType = PropTypes.arrayOf(documentType);

export const historyType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  body: PropTypes.string.isRequired,
  author: authorType.isRequired,
  reviewer: authorType,
  creationDate: PropTypes.instanceOf(Date),
  reviewedDate: PropTypes.instanceOf(Date),
  relevance: PropTypes.number,
  language: PropTypes.string
});

export const historiesType = PropTypes.arrayOf(historyType);

export const locationType = PropTypes.shape({
  id: PropTypes.number,
  title: PropTypes.string,
  body: PropTypes.string,
  author: authorType.isRequired,
  reviewer: authorType,
  creationDate: PropTypes.instanceOf(Date),
  reviewedDate: PropTypes.instanceOf(Date),
  relevance: PropTypes.number,
  language: PropTypes.string
});

export const locationsType = PropTypes.arrayOf(locationType);

export const obstacleType = PropTypes.shape({
  obstacle: PropTypes.string,
  rope: PropTypes.string,
  observation: PropTypes.string,
  anchor: PropTypes.string
});

export const riggingType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  obstacles: PropTypes.arrayOf(obstacleType),
  author: authorType,
  reviewer: authorType,
  reviewedDate: PropTypes.instanceOf(Date),
  creationDate: PropTypes.instanceOf(Date),
  language: PropTypes.string
});

export const riggingsType = PropTypes.arrayOf(riggingType);

Entry.propTypes = {
  children: PropTypes.node.isRequired,
  comments: commentsType.isRequired,
  descriptions: descriptionsType.isRequired,
  documents: documentsType.isRequired,
  details: detailsType.isRequired,
  histories: historiesType.isRequired,
  loading: PropTypes.bool,
  locations: locationsType.isRequired,
  riggings: riggingsType.isRequired
};

export default Entry;
