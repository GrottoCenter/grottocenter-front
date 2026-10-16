import PropTypes from 'prop-types';

import { DocumentChildPropTypes } from './document.type';
import { EntranceSimplePropTypes } from './entrance.type';
import { OrganizationSimplePropTypes } from './organization.type';

export const PersonPropTypes = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
  surname: PropTypes.string,
  nickname: PropTypes.string,
  language: PropTypes.string,
  groups: PropTypes.arrayOf(PropTypes.shape({})),
  organizations: PropTypes.arrayOf(OrganizationSimplePropTypes),
  documents: PropTypes.arrayOf(DocumentChildPropTypes),
  authoredCount: PropTypes.number,
  exploredEntrances: PropTypes.arrayOf(EntranceSimplePropTypes)
});
