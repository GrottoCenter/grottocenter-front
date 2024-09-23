import PropTypes from 'prop-types';

import { EntranceSimplePropTypes } from './entrance.type';

// eslint-disable-next-line import/prefer-default-export
export const PersonPropTypes = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
  surname: PropTypes.string,
  nickname: PropTypes.string,
  language: PropTypes.string,
  groups: PropTypes.arrayOf(PropTypes.shape({})),
  organizations: PropTypes.arrayOf(PropTypes.shape({})),
  documents: PropTypes.arrayOf(PropTypes.shape({})),
  exploredEntrances: PropTypes.arrayOf(EntranceSimplePropTypes)
});
