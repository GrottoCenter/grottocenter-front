import React from 'react';
import { Information } from './utils';
import idNameType from '../../../../../../types/idName.type';

export const NetworkPopup = ({ network }) => (
  <Information
    isTitle
    value={network.name && network.name.toUpperCase()}
    url={`/ui/caves/${network.id}`}
  />
);

NetworkPopup.propTypes = {
  network: idNameType.isRequired
};

export default NetworkPopup;
