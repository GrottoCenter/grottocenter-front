import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';
import EmailIcon from '@material-ui/icons/Email';
import LocationIcon from '@material-ui/icons/LocationOn';

// import MultipleMarkersMap from '../../common/Maps/MapMultipleMarkers';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import OrganizationMarker from '../../common/Maps/common/Markers/Components/OrganizationMarker';
import OrganizationPopup from '../../common/Maps/common/Markers/Components/OrganizationPopup';

const ContentWrapper = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.spacing(1)}px;
`;

const StyledLocationIcon = styled(LocationIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
`;

const StyledEmailIcon = styled(EmailIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
`;

const Details = ({
  address,
  city,
  country,
  county,
  customMessage,
  mail,
  postalCode,
  region,
  village,
  position,
  organization
}) => {
  return (
    <>
      <ContentWrapper>
        <StyledLocationIcon color="primary" />
        <Typography>
          {!isNil(country) && `${country}`}
          {!isNil(region) && ` - ${region}`}
          {!isNil(county) && ` - ${county}`}
          {!isNil(city) && ` - ${city}`}
          {!isNil(village) && ` - ${village}`}
          {!isNil(postalCode) && ` - ${postalCode}`}
          {!isNil(address) && ` - ${address}`}
        </Typography>
      </ContentWrapper>
      {mail && (
        <ContentWrapper>
          <StyledEmailIcon color="primary" />
          <Typography>{mail}</Typography>
        </ContentWrapper>
      )}
      {customMessage && (
        <ContentWrapper>
          <Typography>{customMessage}</Typography>
        </ContentWrapper>
      )}
      {position && (
        <>
          <CustomMapContainer
            wholePage={false}
            dragging
            viewport={null}
            scrollWheelZoom={false}
            zoom={14}
            center={position}>
            <Marker icon={OrganizationMarker} position={position}>
              <Popup>
                <OrganizationPopup organization={organization} />
              </Popup>
            </Marker>
          </CustomMapContainer>
        </>
      )}
    </>
  );
};

Details.propTypes = {
  address: PropTypes.string,
  mail: PropTypes.string,
  customMessage: PropTypes.string,
  city: PropTypes.string,
  country: PropTypes.string,
  county: PropTypes.string,
  region: PropTypes.string,
  postalCode: PropTypes.string,
  village: PropTypes.string,
  position: PropTypes.arrayOf(PropTypes.number),
  organization: PropTypes.shape({})
};

export default Details;

/* <MultipleMarkersMap
        loading={boolean('Loading', false)}
        selection={select('Entrance markers', positions, [[43.35266, 5.81689]])}
      /> 
      
      <CustomMapContainer
          wholePage={false}
          dragging={false}
          viewport={null}
          scrollWheelZoom={false}
          zoom={16}
          center={position}>
          <Marker position={position}>
            <Popup> {address}</Popup>
          </Marker>
        </CustomMapContainer> 

        <MapContainer center={position} zoom={16} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://beta.grottocenter.org/">GrottoCenter</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>{address}</Popup>
          </Marker>
        </MapContainer> */
