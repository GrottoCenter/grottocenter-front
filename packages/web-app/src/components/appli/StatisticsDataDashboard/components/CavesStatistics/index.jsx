import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Divider, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoBlock from './InfoBlock';

import { depthIcon, lengthIcon } from '../../../../../assets/icons';

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'grid',
  alignItems: 'center',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr !important',
    '& hr': { display: 'none' },
  },
}));

const styledImg = { width: '100%', height: 'auto' };

const CavesStatistics = ({ avgDepth, avgLength, totalLength }) => {
  const { formatMessage } = useIntl();

  const tooltipText = totalLength
    ? `${formatMessage({ id: 'Calculated on' })} ${totalLength.nb_data} ${formatMessage({ id: 'caves' })}`
    : '';

  const blocks = [
    avgDepth != null && (
      <InfoBlock
        key="depth"
        icon={<img style={styledImg} src={depthIcon} alt={formatMessage({ id: 'Depth icon' })} />}
        numberData={avgDepth}
        text={formatMessage({ id: 'average depth' })}
      />
    ),
    avgLength != null && (
      <InfoBlock
        key="length"
        icon={<img style={styledImg} src={lengthIcon} alt={formatMessage({ id: 'Length icon' })} />}
        numberData={avgLength}
        text={formatMessage({ id: 'average length' })}
      />
    ),
    totalLength != null && (
      <InfoBlock
        key="total"
        icon={
          <Tooltip title={tooltipText}>
            <img style={styledImg} src={lengthIcon} alt={formatMessage({ id: 'Length icon' })} />
          </Tooltip>
        }
        numberData={totalLength.value}
        text={formatMessage({ id: 'cumulated length' })}
      />
    ),
  ].filter(Boolean);

  // Each block gets a "1fr" column; between blocks, an "auto" column hosts the vertical <Divider>.
  const cols = blocks.map((_, i) => (i < blocks.length - 1 ? ['1fr', 'auto'] : ['1fr'])).flat();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" textAlign="center" pb={2}>
        {formatMessage({ id: 'Caves statistics' })}
      </Typography>
      <StyledBox sx={{ gridTemplateColumns: cols.join(' ') }}>
        {blocks.map((block, i) => (
          <React.Fragment key={block.key}>
            {block}
            {i < blocks.length - 1 && <Divider orientation="vertical" flexItem />}
          </React.Fragment>
        ))}
      </StyledBox>
    </Box>
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
