import * as React from 'react';
import PropTypes from 'prop-types';
import RiggingTable from '../../Riggings/RiggingTable';

import { ObstaclePropTypes } from '../../../../../types/entrance.type';

const RiggingSnapshots = ({ rigging, previous }) => (
  <RiggingTable {...rigging} previous={previous} />
);

RiggingSnapshots.propTypes = {
  rigging: PropTypes.shape({
    obstacles: Array.of(ObstaclePropTypes),
    title: PropTypes.string
  }),
  previous: PropTypes.shape({
    obstacles: Array.of(ObstaclePropTypes),
    title: PropTypes.string
  })
};

export default RiggingSnapshots;
