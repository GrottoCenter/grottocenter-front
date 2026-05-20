import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@mui/material';
import CustomIcon from '../../../../common/CustomIcon';
import InlineData from './InlineData';

const CavesData = ({ title, nbMassifs, nbCaves, nbDivingCaves, nbNetworks }) => {
  const { formatMessage } = useIntl();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" textAlign="center" pb={2}>
        {title}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {nbMassifs !== undefined && nbMassifs !== null && (
          <InlineData
            icon={<CustomIcon type="massif" size={40} />}
            numberData={nbMassifs}
            text={formatMessage({ id: nbMassifs > 1 ? 'massifs' : 'massif' })}
          />
        )}
        {nbCaves !== undefined && nbCaves !== null && (
          <InlineData
            icon={<CustomIcon type="entrance" size={40} />}
            numberData={nbCaves}
            text={formatMessage({ id: 'cave_with_entrances' }, { count: nbCaves })}
          />
        )}
        {nbDivingCaves !== undefined && nbDivingCaves !== null && (
          <InlineData
            icon={<CustomIcon type="diving_cave" size={40} />}
            numberData={nbDivingCaves}
            text={formatMessage({ id: 'diveable_caves' }, { count: nbDivingCaves })}
          />
        )}
        {nbNetworks !== undefined && nbNetworks !== null && (
          <InlineData
            icon={<CustomIcon type="network" size={40} />}
            numberData={nbNetworks}
            text={formatMessage({ id: 'network_count' }, { count: nbNetworks })}
          />
        )}
      </Box>
    </Box>
  );
};

CavesData.propTypes = {
  title: PropTypes.string,
  nbMassifs: PropTypes.number,
  nbCaves: PropTypes.number,
  nbDivingCaves: PropTypes.number,
  nbNetworks: PropTypes.number
};

export default CavesData;
