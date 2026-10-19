import PropTypes from 'prop-types';
import { Marker, Popup } from 'react-leaflet';
import { Box, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import LanguageIcon from '@mui/icons-material/Language';
import Linkify from 'linkify-react';
import { useIntl } from 'react-intl';
import { isMobile } from 'react-device-detect';

import { getOrganizationMarker } from '@/components/common/Maps/common/Markers/Components/OrganizationMarker';
import CustomIcon from '@/components/common/CustomIcon';
import OrganizationIcon from '@/components/common/OrganizationIcon';
import { Property } from '@/components/common/Properties';
import {
  canOrganizationExplore,
  getOrganizationTypeLabelId
} from '@/utils/organizationTypes';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import MultilinesTypography from '../../common/MultilinesTypography';
import OrganizationPopup from '../../common/Maps/common/Markers/Components/OrganizationPopup';
import InfoSection from '../../common/InfoSection';
import { GrottoFullPropTypes } from '../../../types/grotto.type';
import linkifyOptions from '../../../helpers/linkifyOptions';

const InfoRow = styled('div')`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const SectionPaper = styled(Paper)`
  padding: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  background-color: ${({ theme }) => theme.palette.grey[50]};
`;

const StatItem = ({ iconType, alt, count, label }) => (
  <Property
    icon={<CustomIcon type={iconType} alt={alt} />}
    label={label}
    value={String(count)}
    flexBasis="auto"
  />
);

StatItem.propTypes = {
  iconType: PropTypes.oneOf(['caver', 'bibliography', 'network', 'entrance'])
    .isRequired,
  alt: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired
};

const Details = ({ organization }) => {
  const { formatMessage } = useIntl();
  const hasExploration = canOrganizationExplore(organization.type);

  let position = [];
  if (organization?.latitude != null && organization?.longitude != null) {
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
  const documentsCount =
    (organization.authoredCount ?? 0) + (organization.publishedCount ?? 0);
  const documentsLabel = formatMessage({ id: 'Documents' });

  return (
    <Box
      data-testid="organization-properties"
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm:
              position.length > 0
                ? 'repeat(2, minmax(0, 1fr))'
                : 'minmax(0, 1fr)'
          },
          gridTemplateAreas: {
            xs:
              position.length > 0
                ? '"summary" "map" "info"'
                : '"summary" "info"',
            sm:
              position.length > 0
                ? '"map summary" "map info"'
                : '"summary" "info"'
          },
          gridTemplateRows: { sm: 'auto 1fr' },
          columnGap: { xs: 1, sm: 2 },
          rowGap: 1
        }}>
        {/* Type first, with statistics alongside when space permits. */}
        <SectionPaper
          variant="outlined"
          data-testid="organization-summary"
          sx={{
            gridArea: 'summary',
            containerType: 'inline-size',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
          <Box
            data-testid="organization-type"
            sx={{ flex: { xs: '1 1 100%', sm: '1 1 11rem' }, minWidth: 0 }}>
            <Property
              label={formatMessage({ id: 'organizationType.label' })}
              icon={<OrganizationIcon organizationType={organization.type} />}
              value={
                <span data-testid="organization-type-label">
                  {formatMessage({
                    id: getOrganizationTypeLabelId(organization.type)
                  })}
                </span>
              }
              flexBasis="auto"
            />
          </Box>
          <Box
            data-testid="organization-statistics"
            sx={{
              flex: { xs: '1 1 100%', sm: '4 1 22rem' },
              minWidth: 0,
              display: 'grid',
              gridTemplateColumns: hasExploration
                ? 'repeat(2, minmax(0, 1fr))'
                : 'minmax(0, 1fr)',
              '@container (min-width: 22rem)': {
                gridTemplateColumns: {
                  sm: hasExploration
                    ? 'repeat(4, minmax(0, 1fr))'
                    : 'minmax(0, 1fr)'
                }
              },
              gap: 1
            }}>
            {hasExploration && (
              <StatItem
                iconType="caver"
                alt="cavers"
                count={nbCavers}
                label={formatMessage({ id: 'members' })}
              />
            )}
            <StatItem
              iconType="bibliography"
              alt={documentsLabel}
              count={documentsCount}
              label={documentsLabel}
            />
            {hasExploration && (
              <StatItem
                iconType="network"
                alt="networks"
                count={nbNetworks}
                label={formatMessage({ id: 'Networks' })}
              />
            )}
            {hasExploration && (
              <StatItem
                iconType="entrance"
                alt="entrances"
                count={nbEntrances}
                label={formatMessage({ id: 'Entrances' })}
              />
            )}
          </Box>
        </SectionPaper>

        {/* LEFT: Map only */}
        {position.length > 0 && (
          <Box
            data-testid="organization-map"
            sx={{ gridArea: 'map', minWidth: 0 }}>
            <CustomMapContainer
              wholePage={false}
              sx={{
                minHeight: { xs: 240, sm: 400 },
                height: { xs: 240, sm: '100%' }
              }}
              dragging={!isMobile}
              viewport={null}
              scrollWheelZoom={false}
              zoom={14}
              center={position}>
              <Marker
                icon={getOrganizationMarker(organization)}
                position={position}>
                <Popup>
                  <OrganizationPopup organization={organization} />
                </Popup>
              </Marker>
            </CustomMapContainer>
          </Box>
        )}
        {/* Contact and description below the summary on desktop. */}
        <Box
          sx={{
            gridArea: 'info',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
          {/* Contact Paper */}
          {(hasAddress || organization.mail || organization.url) && (
            <SectionPaper variant="outlined" data-testid="organization-contact">
              <InfoSection
                component="h2"
                title={formatMessage({ id: 'Contact' })}>
                {hasAddress && (
                  <InfoRow>
                    <LocationCityIcon
                      color="primary"
                      sx={{ fontSize: 24, flexShrink: 0 }}
                    />
                    <Typography>{addressText}</Typography>
                  </InfoRow>
                )}
                {organization.mail && (
                  <InfoRow>
                    <AlternateEmailIcon
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
              <InfoSection
                component="h2"
                title={formatMessage({ id: 'Description' })}>
                <MultilinesTypography>
                  <Linkify options={linkifyOptions}>
                    {organization.customMessage}
                  </Linkify>
                </MultilinesTypography>
              </InfoSection>
            </SectionPaper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

Details.propTypes = { organization: GrottoFullPropTypes };

export default Details;
