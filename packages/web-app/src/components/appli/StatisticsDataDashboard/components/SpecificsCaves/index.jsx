import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useTheme, styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import CaveCard from './CaveCard';

const StyledBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SpecificsCaves = ({ maxDepthCave, maxLengthCave, parentEntity }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" textAlign="center" pb={2}>
        {formatMessage({ id: 'Specifics caves' })}
      </Typography>
      <StyledBox>
        {maxDepthCave && (
          <CaveCard
            idCave={maxDepthCave.id_cave}
            nameCave={maxDepthCave.name_cave}
            numberData={maxDepthCave.value}
            text={`${formatMessage({
              id: 'is the deepest cave of the'
            })} ${parentEntity}`}
            backgroundColor={theme.palette.secondary.main}
          />
        )}
        {maxLengthCave && (
          <CaveCard
            idCave={maxLengthCave.id_cave}
            nameCave={maxLengthCave.name_cave}
            numberData={maxLengthCave.value}
            text={`${formatMessage({
              id: 'is the longest cave of the'
            })} ${parentEntity}`}
            backgroundColor={theme.palette.primary.main}
          />
        )}
      </StyledBox>
    </Box>
  );
};

SpecificsCaves.propTypes = {
  maxDepthCave: PropTypes.shape({
    name_cave: PropTypes.string,
    id_cave: PropTypes.number,
    value: PropTypes.number
  }),
  maxLengthCave: PropTypes.shape({
    name_cave: PropTypes.string,
    id_cave: PropTypes.number,
    value: PropTypes.number
  }),
  parentEntity: PropTypes.string
};

export default SpecificsCaves;
