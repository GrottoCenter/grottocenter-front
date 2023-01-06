import * as React from 'react';
import RiggingTable from '../Riggings/RiggingTable';

const RiggingSnapshot = rigging => {
  const riggingInformation = rigging.rigging;
  riggingInformation.obstacles = riggingInformation.deserializeInformation;

  return <RiggingTable {...riggingInformation} />;
};

export default RiggingSnapshot;
