import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Typography, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import InlineData from './InlineData';
import ScrollableContent from '../../../../common/Layouts/Fixed/ScrollableContent';
import CustomIcon from '../../../../common/CustomIcon';

const StyledDivider = () => (
  <Box style={{ margin: '-20px 0' }}>
    <hr />
  </Box>
);

const CavesData = ({
  title,
  nbMassifs,
  nbCaves,
  nbDivingCaves,
  nbNetworks,
  url
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  return (
    <ScrollableContent
      dense
      subTitle
      title={title}
      content={
        <>
          {nbMassifs !== undefined && nbMassifs !== null && (
            <>
              <InlineData
                icon={<CustomIcon type="massif" size={25} />}
                numberData={nbMassifs}
                text={formatMessage({ id: 'massif(s)' })}
              />
              <StyledDivider />
            </>
          )}

          {nbCaves !== undefined && nbCaves !== null && (
            <InlineData
              icon={<CustomIcon type="entrance" size={25} />}
              numberData={nbCaves}
              text={formatMessage({ id: 'cave(s) (1 or multiple entrances)' })}
            />
          )}

          {nbDivingCaves !== undefined && nbDivingCaves !== null && (
            <>
              <StyledDivider />
              <InlineData
                icon={<CustomIcon type="diving_cave" size={25} />}
                numberData={nbDivingCaves}
                text={formatMessage({ id: 'cave(s) are diveable' })}
              />
            </>
          )}

          {nbNetworks !== undefined && nbNetworks !== null && (
            <>
              <StyledDivider />
              <InlineData
                icon={<CustomIcon type="network" size={25} />}
                numberData={nbNetworks}
                text={formatMessage({
                  id: 'network(s) (cave of more than 1 entrance)'
                })}
              />
            </>
          )}

          <Box display="flex" justifyContent="flex-end" alignItems="flex-end">
            <Link style={{ color: theme.palette.secondary.main }} to={url}>
              <Typography fontSize="small">
                {formatMessage({ id: 'Access entrances list' })}
              </Typography>
            </Link>
          </Box>
        </>
      }
    />
  );
};

CavesData.propTypes = {
  title: PropTypes.string,
  nbMassifs: PropTypes.number,
  nbCaves: PropTypes.number,
  nbDivingCaves: PropTypes.number,
  nbNetworks: PropTypes.number,
  url: PropTypes.string
};

export default CavesData;
