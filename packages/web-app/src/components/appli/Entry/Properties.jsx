import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import {
  Box,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Typography
} from '@mui/material';
import {
  WarningAmber,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import CoordinateDisplay from '../../common/CoordinateDisplay';
import { useCoordinatePreference, getCRSLabel } from '../../../hooks';
import DataQualityBadge from '../../common/DataQualityBadge';
import DataQualityHelpButton from '../../common/DataQualityBadge/DataQualityHelpButton';
import { getDataQualityLabelKey } from '../../../utils/dataQuality';

import CustomIcon from '../../common/CustomIcon';
import { Property } from '../../common/Properties';
import InfoSection from '../../common/InfoSection';
import Ratings from './Ratings';
import {
  EntrancePropTypes,
  DataQualityPropTypes
} from '../../../types/entrance.type';
import {
  DepthProperty,
  LengthProperty,
  TemperatureProperty,
  DivingProperty,
  OrganizationProperty,
  HasBatProperty,
  DangerFloodingProperty,
  DangerCO2Property,
  NeedCleanGearProperty,
  DangerPollutionProperty,
  DangerRockfallProperty,
  HasRulesProperty,
  NeedStayOnTrailProperty,
  IsTouristicProperty
} from '../../common/CaveProperties';

const GlobalWrapper = styled('div')`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledRatings = styled(Ratings)`
  justify-content: space-evenly;
`;


const CATEGORY_KEYS = [
  { key: 'general', label: 'General data' },
  { key: 'location', label: 'Location' },
  { key: 'description', label: 'Description' },
  { key: 'document', label: 'Document' },
  { key: 'rigging', label: 'Rigging' },
  { key: 'history', label: 'History' },
  { key: 'comment', label: 'Comments' }
];

const Properties = ({ isLoading = false, entrance, dataQuality }) => {
  const { formatMessage } = useIntl();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [preferredCRS] = useCoordinatePreference();
  const massifsWithType =
    entrance?.massifs?.filter(m => m.undergroundType) ?? [];
  const cityValue = [entrance?.city, entrance?.region]
    .flatMap(f => (f ? [f] : []))
    .join(', ');

  return (
    <GlobalWrapper>
      <Paper
        variant="outlined"
        sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
        <InfoSection title={formatMessage({ id: 'Location' })}>
          <Box display="flex" flexDirection="column" gap={0.5}>
            {entrance.latitude && entrance.longitude && (
              <Property
                loading={isLoading}
                label={`${formatMessage({ id: 'Coordinates' })} (${getCRSLabel(preferredCRS)})`}
                value={
                  <CoordinateDisplay
                    latitude={entrance.latitude}
                    longitude={entrance.longitude}
                    precision={entrance.precision}
                    showMapLinks
                    entityType="entrance"
                    entityId={entrance.id}
                  />
                }
                icon={<CustomIcon type="coordinates" />}
              />
            )}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 0.5
              }}>
              {cityValue && (
                <Property
                  loading={isLoading}
                  label={formatMessage({ id: 'City' })}
                  value={cityValue}
                  icon={<CustomIcon type="location" />}
                  secondary
                />
              )}
              {!!entrance.altitude && (
                <Property
                  label={formatMessage({ id: 'Altitude' })}
                  value={`${entrance.altitude} m`}
                  icon={<CustomIcon type="altitude" />}
                />
              )}
            </Box>
          </Box>
        </InfoSection>
      </Paper>
      {(entrance.cave?.depth ||
        entrance.cave?.length ||
        entrance.cave?.temperature ||
        entrance.discoveryYear ||
        massifsWithType.length > 0 ||
        entrance.cave?.isDiving ||
        entrance.isTouristic) && (
        <Paper
          variant="outlined"
          sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
          <InfoSection title={formatMessage({ id: 'Characteristics' })}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 0.5
              }}>
              <DepthProperty
                depth={entrance.cave?.depth}
                isLoading={isLoading}
              />
              <LengthProperty
                length={entrance.cave?.length}
                isLoading={isLoading}
              />
              <TemperatureProperty
                temperature={entrance.cave?.temperature}
                isLoading={isLoading}
              />
              {!!entrance.discoveryYear && (
                <Property
                  label={formatMessage({ id: 'Year of discovery' })}
                  value={entrance.discoveryYear}
                  icon={<CustomIcon type="discovery_date" />}
                />
              )}
              {massifsWithType.map(m => (
                <Property
                  key={m.id}
                  label={formatMessage({ id: 'Underground type' })}
                  value={
                    massifsWithType.length > 1
                      ? `${m.undergroundType} (${m.name})`
                      : m.undergroundType
                  }
                  icon={<CustomIcon type="category" />}
                />
              ))}
              <DivingProperty
                isDiving={entrance.cave?.isDiving}
                isLoading={isLoading}
              />
              <IsTouristicProperty
                isTouristic={entrance.isTouristic}
                isLoading={isLoading}
              />
            </Box>
          </InfoSection>
        </Paper>
      )}
      {(entrance.hasBat ||
        entrance.dangerFlooding ||
        entrance.dangerCo2 ||
        entrance.needCleanGear ||
        entrance.dangerPollution ||
        entrance.dangerRockfall ||
        entrance.hasRules ||
        entrance.needStayOnTrail) && (
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: 'secondary.veryLight',
            borderColor: 'secondary.light'
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <WarningAmber sx={{ color: 'secondary.main', fontSize: 20 }} />
            <Typography
              variant="subtitle1"
              component="h3"
              fontWeight={600}
              color="secondary.main">
              {formatMessage({ id: 'Hazards & restrictions' })}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 0.5
            }}>
            <HasBatProperty hasBat={entrance.hasBat} isLoading={isLoading} />
            <DangerFloodingProperty
              dangerFlooding={entrance.dangerFlooding}
              isLoading={isLoading}
            />
            <DangerCO2Property
              dangerCo2={entrance.dangerCo2}
              isLoading={isLoading}
            />
            <NeedCleanGearProperty
              needCleanGear={entrance.needCleanGear}
              isLoading={isLoading}
            />
            <DangerPollutionProperty
              dangerPollution={entrance.dangerPollution}
              isLoading={isLoading}
            />
            <DangerRockfallProperty
              dangerRockfall={entrance.dangerRockfall}
              isLoading={isLoading}
            />
            <HasRulesProperty
              hasRules={entrance.hasRules}
              isLoading={isLoading}
            />
            <NeedStayOnTrailProperty
              needStayOnTrail={entrance.needStayOnTrail}
              isLoading={isLoading}
            />
          </Box>
        </Paper>
      )}
      {entrance.cave?.exploringOrganizations?.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
          <InfoSection title={formatMessage({ id: 'Exploring organizations' })}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                }
              }}>
              {entrance.cave.exploringOrganizations.map(org => (
                <OrganizationProperty key={org.id} organization={org} />
              ))}
            </Box>
          </InfoSection>
        </Paper>
      )}
      {dataQuality?.total != null && (
        <Paper
          variant="outlined"
          sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
          <InfoSection title={formatMessage({ id: 'Data quality' })}>
            <Box display="flex" flexDirection="column">
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <DataQualityBadge value={dataQuality.total} size={32} />
                <Typography variant="body2">
                  {formatMessage({ id: getDataQualityLabelKey(dataQuality.total) })}
                </Typography>
                <DataQualityHelpButton />
                {dataQuality.categories && (
                  <Box
                    onClick={() => setCategoriesOpen(o => !o)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      color: 'text.secondary',
                      ml: 'auto',
                      userSelect: 'none'
                    }}>
                    <Typography variant="caption">
                      {formatMessage({ id: 'Details by category' })}
                    </Typography>
                    <IconButton size="small" sx={{ p: 0.25 }}>
                      {categoriesOpen ? (
                        <ExpandLess fontSize="small" />
                      ) : (
                        <ExpandMore fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                )}
              </Box>
              {dataQuality.categories && (
                <Collapse in={categoriesOpen}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                      columnGap: 2,
                      rowGap: '4px',
                      pt: '4px'
                    }}>
                    {CATEGORY_KEYS.map(({ key, label }) => {
                      const score = dataQuality.categories[key];
                      if (score == null) return null;
                      const color =
                        score >= 70
                          ? 'success'
                          : score >= 40
                            ? 'warning'
                            : 'error';
                      return (
                        <Box
                          key={key}
                          display="flex"
                          alignItems="center"
                          gap={0.5}>
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              minWidth: 80,
                              flexShrink: 0,
                              color: 'text.secondary'
                            }}>
                            {formatMessage({ id: label })}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={score}
                            color={color}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              minWidth: 24,
                              textAlign: 'right',
                              color: 'text.secondary'
                            }}>
                            {score}%
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              )}
            </Box>
          </InfoSection>
        </Paper>
      )}
      {!!entrance.stats &&
        !!entrance.stats.approach &&
        !!entrance.stats.aestheticism &&
        !!entrance.stats.caving && (
          <StyledRatings
            access={entrance.stats.approach}
            interest={entrance.stats.aestheticism}
            progression={entrance.stats.caving}
            size="small"
          />
        )}
    </GlobalWrapper>
  );
};

Properties.propTypes = {
  isLoading: PropTypes.bool,
  entrance: EntrancePropTypes,
  dataQuality: DataQualityPropTypes
};

export default Properties;
