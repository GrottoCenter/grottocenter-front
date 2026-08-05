import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';

import InfoSection from '../../common/InfoSection';
import {
  DepthProperty,
  LengthProperty,
  DivingProperty,
  TemperatureProperty,
  OrganizationProperty
} from '../../common/CaveProperties';

const GlobalWrapper = styled('div')`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Properties = ({ isLoading, cave }) => {
  const { formatMessage } = useIntl();

  const hasCharacteristics =
    cave?.depth || cave?.length || cave?.isDiving || cave?.temperature;

  return (
    <GlobalWrapper>
      {hasCharacteristics && (
        <Paper
          variant="outlined"
          sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
          <InfoSection
            component="h2"
            title={formatMessage({ id: 'Characteristics' })}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 0.5
              }}>
              <DepthProperty depth={cave?.depth} isLoading={isLoading} />
              <LengthProperty length={cave?.length} isLoading={isLoading} />
              <TemperatureProperty
                temperature={cave?.temperature}
                isLoading={isLoading}
              />
              <DivingProperty isDiving={cave?.isDiving} isLoading={isLoading} />
            </Box>
          </InfoSection>
        </Paper>
      )}
      {cave?.exploringOrganizations?.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
          <InfoSection
            component="h2"
            title={formatMessage({ id: 'Exploring organizations' })}>
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
              {cave.exploringOrganizations.map(org => (
                <OrganizationProperty key={org.id} organization={org} />
              ))}
            </Box>
          </InfoSection>
        </Paper>
      )}
    </GlobalWrapper>
  );
};

Properties.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  cave: PropTypes.shape({
    id: PropTypes.number.isRequired,
    depth: PropTypes.number,
    length: PropTypes.number,
    temperature: PropTypes.number,
    isDiving: PropTypes.bool,
    exploringOrganizations: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        language: PropTypes.string
      })
    )
  })
};

export default Properties;
