import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useTheme, styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import CaveCard from './CaveCard';
import ScrollableContent from '../../../../common/Layouts/Fixed/ScrollableContent';

const StyledBox = styled(Box)`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
`;

const SpecificsCaves = ({ maxDepthCave, maxLengthCave, parentEntity }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Specifics caves' })}
      content={
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
      }
    />
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
