/* eslint-disable react/forbid-prop-types */
import React, { useState, useCallback, useMemo } from 'react';
import { Grid } from '@material-ui/core';
import PropTypes from 'prop-types';
import GridLine from './Common/GridLine';
import { getEntranceSchema } from './getSchema';
import TitleLine from './Common/TitleLine';
import ActionLine from './Common/ActionLine';
import MapLine from './EntranceComponents/MapLine';
import GridLineCollection from './Common/GridLineCollection';
import shouldLineRender from './shouldLineRender';

const EntrancesHandler = ({
  duplicate1,
  duplicate2,
  handleSubmit,
  handleNotDuplicatesSubmit,
  title1,
  title2
}) => {
  const [author, setAuthor] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [yearDiscovery, setYearDiscovery] = useState('');
  const [dateInscription, setDateInscription] = useState('');
  const [dateReviewed, setDateReviewed] = useState('');
  const [altitude, setAltitude] = useState('');
  const [latitude, setLatitude] = useState(duplicate1.latitude);
  const [longitude, setLongitude] = useState(duplicate1.longitude);
  const [precision, setPrecision] = useState('');
  const [geology, setGeology] = useState('');
  const [cave, setCave] = useState('');
  const [names, setNames] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [riggings, setRiggings] = useState([]);
  const [comments, setComments] = useState([]);

  // eslint-disable-next-line consistent-return
  const getStateData = (attribute, getState) => {
    switch (attribute) {
      case 'author':
        return getState ? author : setAuthor;
      case 'reviewer':
        return getState ? reviewer : setReviewer;
      case 'country':
        return getState ? country : setCountry;
      case 'region':
        return getState ? region : setRegion;
      case 'county':
        return getState ? county : setCounty;
      case 'city':
        return getState ? city : setCity;
      case 'address':
        return getState ? address : setAddress;
      case 'yearDiscovery':
        return getState ? yearDiscovery : setYearDiscovery;
      case 'dateInscription':
        return getState ? dateInscription : setDateInscription;
      case 'dateReviewed':
        return getState ? dateReviewed : setDateReviewed;
      case 'altitude':
        return getState ? altitude : setAltitude;
      case 'precision':
        return getState ? precision : setPrecision;
      case 'geology':
        return getState ? geology : setGeology;
      case 'cave':
        return getState ? cave : setCave;
      case 'names':
        return getState ? names : setNames;
      case 'descriptions':
        return getState ? descriptions : setDescriptions;
      case 'documents':
        return getState ? documents : setDocuments;
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

  const onSubmit = () => {
    handleSubmit({
      author,
      reviewer,
      country,
      region,
      county,
      address,
      yearDiscovery,
      dateInscription,
      dateReviewed,
      altitude,
      latitude,
      longitude,
      precision,
      geology,
      cave,
      names,
      descriptions,
      documents,
      locations,
      riggings,
      comments
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

  return (
    <Grid container direction="column" alignItems="center">
      <TitleLine
        title1={title1}
        title2={title2}
        handleAllClick1={() => handleAllClick(duplicate1)}
        handleAllClick2={() => handleAllClick(duplicate2)}
      />
      {entrancesSchema.map(line => {
        if (
          shouldLineRender(
            line.isCollection,
            duplicate1[line.attribute],
            duplicate2[line.attribute]
          )
        ) {
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
        return <></>;
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
        handleNotDuplicatesSubmit={handleNotDuplicatesSubmit}
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
