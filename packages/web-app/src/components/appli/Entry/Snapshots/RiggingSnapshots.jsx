import * as React from 'react';
import PropTypes from 'prop-types';
import RiggingTable from '../Riggings/RiggingTable';

const RiggingSnapshot = information => {
  const { rigging } = information;
  rigging.obstacles = rigging.deserialize;

  return <RiggingTable {...rigging} />;
};
RiggingSnapshot.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  information: PropTypes.node
};
export default RiggingSnapshot;
