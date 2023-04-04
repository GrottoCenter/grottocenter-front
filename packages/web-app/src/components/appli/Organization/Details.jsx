import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import PropTypes from 'prop-types';
import { isNil, isEmpty } from 'ramda';
import { Box, Typography } from '@material-ui/core';
import styled from 'styled-components';
import EmailIcon from '@material-ui/icons/Email';
import LocationIcon from '@material-ui/icons/LocationOn';

import { FlagRounded } from '@material-ui/icons';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import OrganizationMarker from '../../common/Maps/common/Markers/Components/OrganizationMarker';
import OrganizationPopup from '../../common/Maps/common/Markers/Components/OrganizationPopup';
import { Property } from '../../common/Properties';

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
}) => (
  <>
    <Box
      alignItems="start"
      display="flex"
      flexBasis="200px"
      justifyContent="space-between">
      <Box display="block">
        <ContentWrapper>
          <StyledLocationIcon color="primary" />
          <Typography>
            {!isNil(address) && `${address}`}
            {!isNil(postalCode) && ` ${postalCode}`}
            {!isNil(city) && ` ${city}`}
            {!isNil(village) && ` - ${village}`}
            {!isNil(county) && ` - ${county}`}
            {!isNil(region) && ` - ${region}`}
          </Typography>
        </ContentWrapper>
        {!isNil(country) && (
          <Property
            label=""
            value={country}
            url={`/ui/countries/${country}`}
            icon={<FlagRounded fontSize="large" color="primary" />}
            secondary
          />
        )}
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
      </Box>
    </Box>
    <br />
    {!isEmpty(position) && (
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
    )}
  </>
);

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
