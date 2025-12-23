import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';

import InfoSection from '../../common/InfoSection';
import {
  SecondaryPropertiesWrapper,
  DepthProperty,
  LengthProperty,
  MassifProperty,
  DivingProperty,
  TemperatureProperty,
  OrganizationProperty
} from '../../common/CaveProperties';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Properties = ({ isLoading, cave, children }) => {
  const { formatMessage } = useIntl();

  const hasCaveInfo =
    children ||
    cave?.depth ||
    cave?.length ||
    cave?.massifs?.length > 0 ||
    cave?.isDiving ||
    cave?.temperature;

  return (
    <Wrapper>
      {hasCaveInfo && (
        <InfoSection title={formatMessage({ id: 'Cave information' })}>
          {children}
          <DepthProperty depth={cave?.depth} isLoading={isLoading} />
          <LengthProperty length={cave?.length} isLoading={isLoading} />
          <SecondaryPropertiesWrapper>
            {cave?.massifs?.map(massif => (
              <MassifProperty key={massif.id} massif={massif} secondary />
            ))}
            <DivingProperty isDiving={cave?.isDiving} isLoading={isLoading} />
            <TemperatureProperty
              temperature={cave?.temperature}
              isLoading={isLoading}
            />
          </SecondaryPropertiesWrapper>
        </InfoSection>
      )}
      {cave?.exploringOrganizations?.length > 0 && (
        <InfoSection title={formatMessage({ id: 'Exploring organizations' })}>
          <SecondaryPropertiesWrapper>
            {cave.exploringOrganizations.map(org => (
              <OrganizationProperty key={org.id} organization={org} />
            ))}
          </SecondaryPropertiesWrapper>
        </InfoSection>
      )}
    </Wrapper>
  );
};

Properties.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  children: PropTypes.node,
  cave: PropTypes.shape({
    id: PropTypes.number.isRequired,
    depth: PropTypes.number,
    length: PropTypes.number,
    temperature: PropTypes.number,
    isDiving: PropTypes.bool,
    massifs: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired
      })
    ),
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
