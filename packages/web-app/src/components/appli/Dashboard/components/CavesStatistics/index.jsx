import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import { Badge, Box, Tooltip } from '@material-ui/core';
import InfoBlock from './InfoBlock';

import ScrollableContent from '../../../../common/Layouts/Fixed/ScrollableContent';

const StyledBadge = withStyles(() => ({
  badge: {
    right: 3,
    top: 4,
    padding: '0px 4px',
    fontSize: '10px'
  }
}))(Badge);

const StyledBox = withStyles(() => ({
  root: {
    display: 'flex',
    justifyContent: 'space-around'
  }
}))(Box);

const styledImg = { width: '100%', height: 'auto' };

const CavesStatistics = ({ avgDepth, avgLength, totalLength }) => {
  const { formatMessage } = useIntl();

  const tooltipText = `${formatMessage({ id: 'Calculated on' })} ${
    totalLength.nb_data
  } ${formatMessage({ id: 'caves' })}`;

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Caves statistics' })}
      content={
        <StyledBox>
          {avgDepth && (
            <InfoBlock
              icon={
                <img
                  style={styledImg}
                  src="/images/iconsV3/depth.svg"
                  alt="entry icon"
                />
              }
              numberData={avgDepth}
              text="average depth"
            />
          )}

          {avgLength && (
            <InfoBlock
              icon={
                <img
                  style={styledImg}
                  src="/images/iconsV3/length.svg"
                  alt="entry icon"
                />
              }
              alt="entry icon"
              numberData={avgLength}
              text="average length"
            />
          )}

          {totalLength && (
            <InfoBlock
              icon={
                <Tooltip title={tooltipText}>
                  <StyledBadge
                    badgeContent={totalLength.nb_data}
                    color="secondary"
                    max={999}>
                    <img
                      style={styledImg}
                      src="/images/iconsV3/length.svg"
                      alt="network icon"
                    />
                  </StyledBadge>
                </Tooltip>
              }
              // TODO: rename variable in back
              numberData={totalLength.value}
              text="cumulated length"
            />
          )}
        </StyledBox>
      }
    />
  );
};

CavesStatistics.propTypes = {
  avgDepth: PropTypes.number,
  avgLength: PropTypes.number,
  totalLength: PropTypes.shape({
    value: PropTypes.number,
    nb_data: PropTypes.number
  })
};

export default CavesStatistics;
