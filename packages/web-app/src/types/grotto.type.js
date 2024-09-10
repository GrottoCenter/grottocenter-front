import PropTypes from 'prop-types';

import { EntranceSimplePropTypes } from './entrance.type';

export const CaverPropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string,
  nickname: PropTypes.string
});

export const NetworkPropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  depth: PropTypes.number,
  name: PropTypes.string.isRequired,
  length: PropTypes.number
});

export const GrottoFullPropTypes = PropTypes.shape({
  id: PropTypes.number,
  isDeleted: PropTypes.bool,
  address: PropTypes.string,
  mail: PropTypes.string,
  customMessage: PropTypes.string,
  cavers: PropTypes.arrayOf(CaverPropTypes),
  city: PropTypes.string,
  country: PropTypes.string,
  county: PropTypes.string,
  exploredEntrances: PropTypes.arrayOf(EntranceSimplePropTypes),
  exploredNetworks: PropTypes.arrayOf(NetworkPropTypes),
  isOfficialPartner: PropTypes.bool,
  name: PropTypes.string.isRequired,
  region: PropTypes.string,
  postalCode: PropTypes.string,
  village: PropTypes.string,
  yearBirth: PropTypes.number,
  longitude: PropTypes.number,
  latitude: PropTypes.number,
  documents: PropTypes.arrayOf(PropTypes.shape({})),
  position: PropTypes.arrayOf(PropTypes.number),
  organization: PropTypes.shape({})
});
