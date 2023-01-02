import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import PropTypes from 'prop-types';
import { isNil, isEmpty } from 'ramda';
import { Box, Typography, IconButton } from '@mui/material';
import styled from 'styled-components';
import EmailIcon from '@mui/icons-material/Email';
import LocationIcon from '@mui/icons-material/LocationOn';
import CreateIcon from '@mui/icons-material/Create';

import CustomMapContainer from '../../common/Maps/common/MapContainer';
import OrganizationMarker from '../../common/Maps/common/Markers/Components/OrganizationMarker';
import OrganizationPopup from '../../common/Maps/common/Markers/Components/OrganizationPopup';

const ContentWrapper = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.spacing(1)};
`;

const StyledLocationIcon = styled(LocationIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)};
`;

const StyledEmailIcon = styled(EmailIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)};
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
  organization,
  onEdit,
  canEdit
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
            {!isNil(country) && ` ${country}`}
            {!isNil(village) && ` - ${village}`}
            {!isNil(county) && ` - ${county}`}
            {!isNil(region) && ` - ${region}`}
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
      </Box>
      {canEdit && (
        <IconButton
          size="medium"
          aria-label="edit"
          color="primary"
          onClick={onEdit}
          disabled={isNil(onEdit)}>
          <CreateIcon />
        </IconButton>
      )}
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
  organization: PropTypes.shape({}),
  onEdit: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired
};

export default Details;
