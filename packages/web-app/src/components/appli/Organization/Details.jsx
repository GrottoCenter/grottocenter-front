import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';
import LocationIcon from '@mui/icons-material/LocationOn';
import Linkify from 'linkify-react';

import CustomIcon from '../../common/CustomIcon';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import MultilinesTypography from '../../common/MultilinesTypography';
import OrganizationMarker from '../../common/Maps/common/Markers/Components/OrganizationMarker';
import OrganizationPopup from '../../common/Maps/common/Markers/Components/OrganizationPopup';
import { Property } from '../../common/Properties';
import { GrottoFullPropTypes } from '../../../types/grotto.type';
import linkifyOptions from '../../../helpers/linkifyOptions';

const ContentWrapper = styled('div')`
  display: flex;
  padding: ${({ theme }) => theme.spacing(1)};
`;

const StyledLocationIcon = styled(LocationIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)};
`;

const StyledEmailIcon = styled(EmailIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)};
`;

const Details = ({ organization }) => {
  let position = [];
  if (organization?.latitude && organization?.longitude) {
    position = [organization?.latitude, organization?.longitude];
  }

  return (
    <>
      <Box
        alignItems="start"
        display="flex"
        flexBasis="200px"
        justifyContent="space-between">
        <Box display="block">
          <ContentWrapper>
            {organization.address ||
            organization.postalCode ||
            organization.city ? (
              <StyledLocationIcon color="primary" />
            ) : null}
            <Typography>
              {organization.address && `${organization.address}`}
              {organization.postalCode && ` ${organization.postalCode}`}
              {organization.city && ` ${organization.city}`}
              {organization.county && ` - ${organization.county}`}
              {organization.region && ` - ${organization.region}`}
            </Typography>
          </ContentWrapper>
          {organization.country && (
            <Property
              label=""
              value={organization.country}
              url={`/ui/countries/${organization.country}`}
              icon={<CustomIcon type="country" />}
              secondary
            />
          )}
          {organization.mail && (
            <ContentWrapper>
              <StyledEmailIcon color="primary" />
              <Typography>
                <Linkify options={linkifyOptions}>{organization.mail}</Linkify>
              </Typography>
            </ContentWrapper>
          )}
          {organization.customMessage && (
            <ContentWrapper>
              <MultilinesTypography>
                <Linkify options={linkifyOptions}>{organization.customMessage}</Linkify>
              </MultilinesTypography>
            </ContentWrapper>
          )}
        </Box>
      </Box>
      <br />
      {position.length > 0 && (
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
};

Details.propTypes = { organization: GrottoFullPropTypes };

export default Details;
