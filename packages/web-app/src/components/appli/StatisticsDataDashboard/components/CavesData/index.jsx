import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Waves } from '@material-ui/icons';
import { Box, Typography, useTheme } from '@material-ui/core';
import { Link } from 'react-router-dom';
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
  nbNetworks,
  url
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

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
                    alt="entry icon"
                  />
                }
                numberData={nbMassifs}
                text="massifs are present in this country."
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
                  alt="entry icon"
                />
              }
              numberData={nbCaves}
              text="caves are freely accessible."
            />
          )}

          {nbDivingCaves !== undefined && nbDivingCaves !== null && (
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

          {nbNetworks !== undefined && nbNetworks !== null && (
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

          <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="flex-end"
            marginRight="40px">
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
