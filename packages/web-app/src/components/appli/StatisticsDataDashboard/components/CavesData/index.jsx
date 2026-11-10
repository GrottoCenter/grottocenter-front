import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@mui/material';
import CustomIcon from '../../../../common/CustomIcon';
import InlineData from './InlineData';

const CavesData = ({
  title,
  nbMassifs,
  nbEntrances,
  nbDivingCaves,
  nbNetworks
}) => {
  const { formatMessage } = useIntl();

  return (
    <Box
      data-testid="statistics-counts"
      sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          pb: 1
        }}>
        {title}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {nbMassifs !== undefined && nbMassifs !== null && (
          <InlineData
            icon={<CustomIcon type="massif" size={40} />}
            numberData={nbMassifs}
            text={formatMessage({ id: nbMassifs > 1 ? 'massifs' : 'massif' })}
          />
        )}
        {Number.isFinite(nbEntrances) && (
          <InlineData
            icon={<CustomIcon type="entrance" size={40} />}
            numberData={nbEntrances}
            text={formatMessage(
              { id: 'entrance_count' },
              { count: nbEntrances }
            )}
          />
        )}
        {nbDivingCaves !== undefined && nbDivingCaves !== null && (
          <InlineData
            icon={<CustomIcon type="diving_cave" size={40} />}
            numberData={nbDivingCaves}
            text={formatMessage(
              { id: 'diveable_caves' },
              { count: nbDivingCaves }
            )}
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
  nbEntrances: PropTypes.number,
  nbDivingCaves: PropTypes.number,
  nbNetworks: PropTypes.number
};

export default CavesData;
