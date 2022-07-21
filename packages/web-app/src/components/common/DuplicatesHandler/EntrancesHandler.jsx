/* eslint-disable react/forbid-prop-types */
import React, { useState, useCallback, useMemo } from 'react';
import { Grid } from '@material-ui/core';
import PropTypes from 'prop-types';
import { isEmpty } from 'ramda';
import GridLine from './Common/GridLine';
import { getEntranceSchema } from './utils/getSchema';
import TitleLine from './Common/TitleLine';
import ActionLine from './Common/ActionLine';
import MapLine from './EntranceComponents/MapLine';
import GridLineCollection from './Common/GridLineCollection';
import shouldLineRender from './utils/shouldLineRender';
import {
  getIdOrUndefined,
  retrieveFromObjectCollection
} from './utils/retrieveFromObjectCollection';

const EntrancesHandler = ({
  duplicate1,
  duplicate2,
  handleSubmit,
  handleNotDuplicatesSubmit,
  title1,
  title2
}) => {
  const [author, setAuthor] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [yearDiscovery, setYearDiscovery] = useState('');
  const [altitude, setAltitude] = useState('');
  const [latitude, setLatitude] = useState(duplicate1.latitude);
  const [longitude, setLongitude] = useState(duplicate1.longitude);
  const [precision, setPrecision] = useState('');
  const [cave, setCave] = useState('');
  const [names, setNames] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [riggings, setRiggings] = useState([]);
  const [comments, setComments] = useState([]);

  // eslint-disable-next-line consistent-return
  const getStateData = (attribute, getState) => {
    switch (attribute) {
      case 'author':
        return getState ? author : setAuthor;
      case 'country':
        return getState ? country : setCountry;
      case 'region':
        return getState ? region : setRegion;
      case 'county':
        return getState ? county : setCounty;
      case 'city':
        return getState ? city : setCity;
      case 'discoveryYear':
        return getState ? yearDiscovery : setYearDiscovery;
      case 'altitude':
        return getState ? altitude : setAltitude;
      case 'latitude':
        return getState ? latitude : setLatitude;
      case 'longitude':
        return getState ? longitude : setLongitude;
      case 'precision':
        return getState ? precision : setPrecision;
      case 'cave':
        return getState ? cave : setCave;
      case 'names':
        return getState ? names : setNames;
      case 'descriptions':
        return getState ? descriptions : setDescriptions;
      case 'locations':
        return getState ? locations : setLocations;
      case 'riggings':
        return getState ? riggings : setRiggings;
      case 'comments':
        return getState ? comments : setComments;
      default:
    }
  };

  const entrancesSchema = useMemo(() => getEntranceSchema(), []);

  const isSubmittable = () =>
    !(isEmpty(author) || isEmpty(latitude) || isEmpty(longitude));

  const onSubmit = () => {
    const {
      newItems: newNames,
      previousItems: previousNames
    } = retrieveFromObjectCollection(names);

    const {
      newItems: newPopulatedDescriptions,
      previousItems: previousDescriptions
    } = retrieveFromObjectCollection(descriptions);
    const newDescriptions = newPopulatedDescriptions.map(newDesc => ({
      ...newDesc,
      author: newDesc.author.id
    }));

    const {
      newItems: newLocations,
      previousItems: previousLocations
    } = retrieveFromObjectCollection(locations);

    const {
      newItems: newRiggings,
      previousItems: previousRiggings
    } = retrieveFromObjectCollection(riggings);

    const {
      newItems: newComments,
      previousItems: previousComments
    } = retrieveFromObjectCollection(comments);

    const nullifyNumericalValue = value => (value === '' ? null : value);
    handleSubmit(
      {
        id: duplicate1.id || duplicate2.id,
        author: author.id,
        country,
        region,
        county,
        yearDiscovery: nullifyNumericalValue(yearDiscovery),
        altitude: nullifyNumericalValue(altitude),
        latitude,
        longitude,
        precision: nullifyNumericalValue(precision),
        cave: getIdOrUndefined(cave),
        names: previousNames,
        descriptions: previousDescriptions,
        locations: previousLocations,
        riggings: previousRiggings,
        comments: previousComments
      },
      {
        newNames,
        newDescriptions,
        newLocations,
        newRiggings,
        newComments
      }
    );
  };

  const onNotDuplicatesSubmit = () => {
    handleNotDuplicatesSubmit({
      id: duplicate1.id || duplicate2.id,
      author: author.id,
      country,
      region,
      county,
      yearDiscovery,
      altitude,
      latitude,
      longitude,
      precision,
      cave: cave.id
    });
  };

  const updatePositionState = position => {
    setLatitude(position.lat);
    setLongitude(position.lng);
  };

  const handleAllClick = useCallback(
    duplicate => {
      entrancesSchema.forEach(element =>
        getStateData(element.attribute, false)(duplicate[element.attribute])
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [duplicate1, duplicate2]
  );

  // Latitude and longitude are not rendered, because they are handled in the map component below
  const shoudLineRenderWithCoord = (isCollection, attribute) =>
    attribute !== 'latitude' && attribute !== 'longitude'
      ? shouldLineRender(
          isCollection,
          duplicate1[attribute],
          duplicate2[attribute]
        )
      : false;

  return (
    <Grid container direction="column" alignItems="center">
      <TitleLine
        title1={title1}
        title2={title2}
        handleAllClick1={() => handleAllClick(duplicate1)}
        handleAllClick2={() => handleAllClick(duplicate2)}
      />
      <ActionLine
        handleSubmit={onSubmit}
        handleNotDuplicatesSubmit={onNotDuplicatesSubmit}
        disableSubmit={!isSubmittable()}
      />
      {entrancesSchema.map(line => {
        if (shoudLineRenderWithCoord(line.isCollection, line.attribute)) {
          return line.isCollection ? (
            <GridLineCollection
              key={line.label}
              label={line.label}
              value1={duplicate1[line.attribute]}
              value2={duplicate2[line.attribute]}
              render={line.customRender}
              stateValue={getStateData(line.attribute, true)}
              updateState={getStateData(line.attribute, false)}
              disabled={line.disabled}
            />
          ) : (
            <GridLine
              key={line.label}
              label={line.label}
              value1={duplicate1[line.attribute]}
              value2={duplicate2[line.attribute]}
              render={line.customRender}
              stateValue={getStateData(line.attribute, true)}
              updateState={getStateData(line.attribute, false)}
              disabled={line.disabled}
            />
          );
        }
        return '';
      })}
      <MapLine
        position1={[
          parseFloat(duplicate1.latitude),
          parseFloat(duplicate1.longitude)
        ]}
        position2={[
          parseFloat(duplicate2.latitude),
          parseFloat(duplicate2.longitude)
        ]}
        positionState={[parseFloat(latitude), parseFloat(longitude)]}
        updatePositionState={updatePositionState}
      />
      <ActionLine
        handleSubmit={onSubmit}
        handleNotDuplicatesSubmit={onNotDuplicatesSubmit}
        disableSubmit={!isSubmittable()}
      />
    </Grid>
  );
};

export default EntrancesHandler;

EntrancesHandler.propTypes = {
  duplicate1: PropTypes.object.isRequired,
  duplicate2: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleNotDuplicatesSubmit: PropTypes.func.isRequired,
  title1: PropTypes.string,
  title2: PropTypes.string
};
