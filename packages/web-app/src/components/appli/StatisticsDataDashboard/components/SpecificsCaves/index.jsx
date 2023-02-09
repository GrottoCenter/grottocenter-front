import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useTheme, withStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import CaveCard from './CaveCard';
import ScrollableContent from '../../../../common/Layouts/Fixed/ScrollableContent';

const StyledBox = withStyles(() => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap'
  }
}))(Box);

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
