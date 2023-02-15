import * as React from 'react';
import PropTypes from 'prop-types';
import RiggingTable from '../../Riggings/RiggingTable';
import { obstacleType } from '../../Provider';

const RiggingSnapshots = ({ rigging, previous }) => (
  <RiggingTable {...rigging} previous={previous} />
);

RiggingSnapshots.propTypes = {
  rigging: PropTypes.shape({
    obstacles: Array.of(obstacleType),
    title: PropTypes.string
  }),
  previous: PropTypes.shape({
    obstacles: Array.of(obstacleType),
    title: PropTypes.string
  })
};

export default RiggingSnapshots;
