import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { Terrain, Waves, Thermostat } from '@mui/icons-material';

import CustomIcon from '../../common/CustomIcon';
import { Property } from '../../common/Properties';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
`;

const SecondaryPropertiesWrapper = styled('div')`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
`;

const Properties = ({ isLoading, cave, children }) => {
  const { formatMessage } = useIntl();

  return (
    <Wrapper>
      {children}
      {!!cave.depth && (
        <Property
          loading={isLoading}
          label={formatMessage({ id: 'Depth' })}
          value={`${cave.depth} m`}
          icon={<CustomIcon type="depth" />}
        />
      )}
      {!!cave.length && (
        <Property
          loading={isLoading}
          label={formatMessage({ id: 'Development' })}
          value={`${cave.length} m`}
          icon={<CustomIcon type="length" />}
        />
      )}
      <SecondaryPropertiesWrapper>
        {!!cave.massifs &&
          cave.massifs.map(massif => (
            <Property
              id={massif.id}
              label={formatMessage({ id: 'Massif' })}
              value={massif.name}
              url={`/ui/massifs/${massif.id}`}
              icon={<Terrain color="primary" />}
              secondary
            />
          ))}
        {!!cave.isDiving && (
          <Property
            loading={isLoading}
            value={formatMessage({ id: 'Diving cave' })}
            icon={<Waves color="primary" />}
            secondary
          />
        )}
        {!!cave.temperature && (
          <Property
            loading={isLoading}
            label={formatMessage({ id: 'Temperature' })}
            value={`${cave.temperature} °C`}
            icon={<Thermostat fontSize="large" color="primary" />}
          />
        )}
      </SecondaryPropertiesWrapper>
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
    )
  })
};

export default Properties;
