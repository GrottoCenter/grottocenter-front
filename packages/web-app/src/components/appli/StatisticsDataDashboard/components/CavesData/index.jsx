import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Waves } from '@material-ui/icons';
import { Box } from '@material-ui/core';
import InlineData from './InlineData';

import ScrollableContent from '../../../../common/Layouts/Fixed/ScrollableContent';

const styledImg = { width: '100%', height: 'auto' };

const StyledDivider = () => (
  <Box sx={{ margin: '-20px  40px' }}>
    <hr />
  </Box>
);

const CavesData = ({
  title,
  nbMassifs,
  nbCaves,
  nbDivingCaves,
  nbNetworks
}) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      title={title}
      content={
        <>
          {nbMassifs !== undefined && nbMassifs !== null && (
            <>
              <InlineData
                icon={
                  <img
                    style={styledImg}
                    src="/images/massif.svg"
                    alt={formatMessage({ id: 'Massif icon' })}
                  />
                }
                numberData={nbMassifs}
                text={formatMessage({
                  id: 'massifs are present in this country.'
                })}
              />
              <StyledDivider />
            </>
          )}

          {nbCaves !== undefined && nbCaves !== null && (
            <InlineData
              icon={
                <img
                  style={styledImg}
                  src="/images/iconsV3/entry.svg"
                  alt={formatMessage({ id: 'Entrance icon' })}
                />
              }
              numberData={nbCaves}
              text={formatMessage({ id: 'caves are freely accessible.' })}
            />
          )}

          {nbDivingCaves !== undefined && nbDivingCaves !== null && (
            <>
              <StyledDivider />
              <InlineData
                icon={<Waves color="primary" />}
                alt={formatMessage({ id: 'Waves icon' })}
                numberData={nbDivingCaves}
                text={formatMessage({ id: 'caves are diving.' })}
              />
            </>
          )}

          {nbNetworks !== undefined && nbNetworks !== null && (
            <>
              <StyledDivider />
              <InlineData
                icon={
                  <img
                    style={styledImg}
                    src="/images/iconsV3/cave_system.svg"
                    alt={formatMessage({ id: 'Network icon' })}
                  />
                }
                numberData={nbNetworks}
                text={formatMessage({ id: 'networks are freely accessible.' })}
              />
            </>
          )}
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
  nbNetworks: PropTypes.number
};

export default CavesData;
