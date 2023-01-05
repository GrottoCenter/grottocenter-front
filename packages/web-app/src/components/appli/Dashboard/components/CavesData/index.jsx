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

const CavesData = ({ nbCaves, nbDivingCaves, nbNetworks }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Networks and caves' })}
      content={
        <>
          {nbCaves && (
            <InlineData
              icon={
                <img
                  style={styledImg}
                  src="/images/iconsV3/entry.svg"
                  alt="entry icon"
                />
              }
              numberData={nbCaves}
              text="caves are freely accessible."
            />
          )}

          {nbDivingCaves && (
            <>
              <StyledDivider />
              <InlineData
                icon={<Waves color="primary" />}
                alt="entry icon"
                numberData={nbDivingCaves}
                text="caves are diving."
              />
            </>
          )}

          {nbNetworks && (
            <>
              <StyledDivider />
              <InlineData
                icon={
                  <img
                    style={styledImg}
                    src="/images/iconsV3/cave_system.svg"
                    alt="network icon"
                  />
                }
                numberData={nbNetworks}
                text="networks are freely accessible."
              />
            </>
          )}
        </>
      }
    />
  );
};

CavesData.propTypes = {
  nbCaves: PropTypes.number,
  nbDivingCaves: PropTypes.number,
  nbNetworks: PropTypes.number
};

export default CavesData;
