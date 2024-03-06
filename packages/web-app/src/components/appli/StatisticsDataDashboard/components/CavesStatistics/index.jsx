import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Badge, Box, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoBlock from './InfoBlock';

import ScrollableContent from '../../../../common/Layouts/Fixed/ScrollableContent';

const StyledBadge = styled(Badge)`
  right: 3;
  top: 4;
  padding: 0px 4px;
  font-size: 10px;
`;

const StyledBox = styled(Box)`
  display: flex;
  justify-content: space-around;
  flexwrap: wrap;
`;

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
                  alt={formatMessage({ id: 'Depth icon' })}
                />
              }
              numberData={avgDepth}
              text={formatMessage({ id: 'average depth' })}
            />
          )}

          {avgLength && (
            <InfoBlock
              icon={
                <img
                  style={styledImg}
                  src="/images/iconsV3/length.svg"
                  alt={formatMessage({ id: 'Length icon' })}
                />
              }
              alt="entry icon"
              numberData={avgLength}
              text={formatMessage({ id: 'average length' })}
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
                      alt={formatMessage({ id: 'Length icon' })}
                    />
                  </StyledBadge>
                </Tooltip>
              }
              numberData={totalLength.value}
              text={formatMessage({ id: 'cumulated length' })}
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
