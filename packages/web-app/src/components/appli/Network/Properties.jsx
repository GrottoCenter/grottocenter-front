import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import {
  Terrain,
  Waves,
  CalendarToday,
  Category,
  Title
} from '@material-ui/icons';

import CustomIcon from '../../common/CustomIcon';
import { isValidPositions } from '../../common/Maps/MapMultipleMarkers';
import { Property } from '../../common/Properties';
import EntrancesSelection from './EntrancesSelection';
import { CaveContext } from './Provider';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const SecondaryPropertiesWrapper = styled.div`
  display: flex;
  justify-content: space-evenly;
  flex-wrap: wrap;
`;

const Properties = () => {
  const {
    state: {
      cave: {
        depth,
        discoveryYear,
        isDivingCave,
        length,
        massif,
        temperature,
        undergroundType
      },
      coordinates,
      selectedEntrances,
      entrances,
      loading
    },
    action: { onSelectEntrance }
  } = useContext(CaveContext);
  const { formatMessage } = useIntl();

  return (
    <Wrapper>
      {isValidPositions(coordinates) && (
        <EntrancesSelection
          onSelect={onSelectEntrance}
          loading={loading}
          entrances={entrances}
          selection={selectedEntrances}
        />
      )}
      <Property
        loading={loading}
        label={formatMessage({ id: 'Depth' })}
        value={`${depth} m`}
        icon={<CustomIcon type="depth" />}
      />
      <Property
        loading={loading}
        label={formatMessage({ id: 'Development' })}
        value={`${length} m`}
        icon={<CustomIcon type="length" />}
      />
      <SecondaryPropertiesWrapper>
        {discoveryYear && (
          <Property
            label={formatMessage({ id: 'Year of discovery' })}
            value={discoveryYear}
            icon={<CalendarToday color="primary" />}
            secondary
          />
        )}
        {undergroundType && (
          <Property
            label={formatMessage({ id: 'Underground type' })}
            value={undergroundType}
            icon={<Category color="primary" />}
            secondary
          />
        )}
        {massif && (
          <Property
            label={formatMessage({ id: 'Massif' })}
            value={massif.name}
            url={`/ui/massifs/${massif.id}`}
            icon={<Terrain color="primary" />}
            secondary
          />
        )}
        {isDivingCave && (
          <Property
            value={formatMessage({
              id: 'Diving cave'
            })}
            icon={<Waves color="primary" />}
            secondary
          />
        )}
        {temperature && (
          <Property
            loading={loading}
            label={formatMessage({ id: 'Temperature' })}
            value={`${temperature} °C`}
            icon={<Title fontSize="large" color="primary" />}
            // TODO: The Thermostat icon is only available in MUI v5
            // icon={<Thermostat fontSize="large" color="primary"/>}
          />
        )}
      </SecondaryPropertiesWrapper>
    </Wrapper>
  );
};

export default Properties;
