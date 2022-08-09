import React from 'react';
import Title from './Title';
import idNameType from '../../../../../../types/idName.type';

export const NetworkPopup = ({ network }) => (
  <Title
    title={network.name && network.name.toUpperCase()}
    link={`/ui/caves/${network.id}`}
  />
);

NetworkPopup.propTypes = {
  network: idNameType.isRequired
};

export default NetworkPopup;
