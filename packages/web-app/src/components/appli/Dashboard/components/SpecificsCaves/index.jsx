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
    justifyContent: 'center'
  }
}))(Box);

const SpecificsCaves = ({ maxDepthCave, maxLengthCave }) => {
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
              nameCave={maxDepthCave.name_cave}
              numberData={maxDepthCave.depth_cave}
              text="is the deepest cave of the massif."
              backgroundColor={theme.palette.secondary.main}
            />
          )}

          {maxLengthCave && (
            <CaveCard
              nameCave={maxLengthCave.name_cave}
              numberData={maxLengthCave.length_cave}
              text="is the longest cave of the massif."
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
    depth_cave: PropTypes.number
  }),
  maxLengthCave: PropTypes.shape({
    name_cave: PropTypes.string,
    id_cave: PropTypes.number,
    length_cave: PropTypes.number
  })
};

export default SpecificsCaves;
