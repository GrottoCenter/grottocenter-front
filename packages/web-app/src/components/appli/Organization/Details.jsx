import React from 'react';
import PropTypes from 'prop-types';
import { Marker, Popup } from 'react-leaflet';
import { Box, Paper, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';
import LocationIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import Linkify from 'linkify-react';
import { useIntl } from 'react-intl';
import { isMobile } from 'react-device-detect';

import CustomMapContainer from '../../common/Maps/common/MapContainer';
import MultilinesTypography from '../../common/MultilinesTypography';
import OrganizationMarker from '../../common/Maps/common/Markers/Components/OrganizationMarker';
import OrganizationPopup from '../../common/Maps/common/Markers/Components/OrganizationPopup';
import InfoSection from '../../common/InfoSection';
import { GrottoFullPropTypes } from '../../../types/grotto.type';
import linkifyOptions from '../../../helpers/linkifyOptions';
import {
  caverIcon,
  entranceIcon,
  networkIcon,
  bibliographyIcon
} from '../../../assets/icons';

const HalfSplitContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    flex-direction: row;
    align-items: stretch;
    gap: ${({ theme }) => theme.spacing(3)};
  }
`;

const InfoRow = styled('div')`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const SectionPaper = styled(Paper)`
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.spacing(1)};
  background-color: ${({ theme }) => theme.palette.grey[50]};
`;

const StatItem = ({ src, alt, count, label }) => (
  <Tooltip title={label}>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: 'default'
      }}>
      <img src={src} alt={alt} style={{ height: 40, width: 40 }} />
      <Typography variant="h5" fontWeight={700} lineHeight={1}>
        {count}
      </Typography>
    </Box>
  </Tooltip>
);

StatItem.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired
};

const Details = ({ organization }) => {
  const { formatMessage } = useIntl();

  let position = [];
  if (organization?.latitude && organization?.longitude) {
    position = [organization.latitude, organization.longitude];
  }

  const hasAddress =
    organization.address ||
    organization.postalCode ||
    organization.city ||
    organization.county ||
    organization.region;

  const addressText = [
    organization.address,
    organization.postalCode,
    organization.city,
    organization.county && `- ${organization.county}`,
    organization.region && `- ${organization.region}`
  ]
    .filter(Boolean)
    .join(' ');

  const nbCavers = (organization.cavers ?? []).length;
  const nbEntrances = (organization.exploredEntrances ?? []).length;
  const nbNetworks = (organization.exploredNetworks ?? []).length;
  const nbDocuments = (organization.documents ?? []).length;

  return (
    <HalfSplitContainer>
      {/* LEFT: Map only */}
      {position.length > 0 && (
        <Box sx={{ flex: 1, minWidth: 0, minHeight: 300 }}>
          <CustomMapContainer
            wholePage={false}
            dragging={!isMobile}
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
        </Box>
      )}

      {/* RIGHT: Stats + Info Papers */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
        {/* Stats — prominent */}
        <SectionPaper variant="outlined">
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <StatItem
              src={caverIcon}
              alt="cavers"
              count={nbCavers}
              label={formatMessage({ id: 'Number of cavers' })}
            />
            <StatItem
              src={bibliographyIcon}
              alt="documents"
              count={nbDocuments}
              label={formatMessage({ id: 'Number of collections' })}
            />
            <StatItem
              src={networkIcon}
              alt="networks"
              count={nbNetworks}
              label={formatMessage({ id: 'Number of explored networks' })}
            />
            <StatItem
              src={entranceIcon}
              alt="entrances"
              count={nbEntrances}
              label={formatMessage({ id: 'Number of explored entrances' })}
            />
          </Box>
        </SectionPaper>

        {/* Contact Paper */}
        {(hasAddress || organization.mail || organization.url) && (
          <SectionPaper variant="outlined">
            <InfoSection title={formatMessage({ id: 'Contact' })}>
              {hasAddress && (
                <InfoRow>
                  <LocationIcon
                    color="primary"
                    sx={{ fontSize: 24, flexShrink: 0 }}
                  />
                  <Typography>{addressText}</Typography>
                </InfoRow>
              )}
              {organization.mail && (
                <InfoRow>
                  <EmailIcon
                    color="primary"
                    sx={{ fontSize: 24, flexShrink: 0 }}
                  />
                  <Typography>
                    <Linkify options={linkifyOptions}>
                      {organization.mail}
                    </Linkify>
                  </Typography>
                </InfoRow>
              )}
              {organization.url && (
                <InfoRow>
                  <LanguageIcon
                    color="primary"
                    sx={{ fontSize: 24, flexShrink: 0 }}
                  />
                  <Typography>
                    <Linkify options={linkifyOptions}>
                      {organization.url}
                    </Linkify>
                  </Typography>
                </InfoRow>
              )}
            </InfoSection>
          </SectionPaper>
        )}

        {/* Description Paper */}
        {organization.customMessage && (
          <SectionPaper variant="outlined">
            <InfoSection title={formatMessage({ id: 'Description' })}>
              <MultilinesTypography>
                <Linkify options={linkifyOptions}>
                  {organization.customMessage}
                </Linkify>
              </MultilinesTypography>
            </InfoSection>
          </SectionPaper>
        )}
      </Box>
    </HalfSplitContainer>
  );
};

Details.propTypes = { organization: GrottoFullPropTypes };

export default Details;
