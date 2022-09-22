import React from 'react';
import PropTypes from 'prop-types';

import { ADVANCED_SEARCH_TYPES } from '../../../../conf/config';

import DocumentsTableHead from './DocumentsTableHead';
import EntrancesTableHead from './EntrancesTableHead';
import MassifsTableHead from './MassifsTableHead';
import OrganizationsTableHead from './OrganizationsTableHead';

const HEADERS = {
  [ADVANCED_SEARCH_TYPES.DOCUMENTS]: <DocumentsTableHead />,
  [ADVANCED_SEARCH_TYPES.ENTRANCES]: <EntrancesTableHead />,
  [ADVANCED_SEARCH_TYPES.MASSIFS]: <MassifsTableHead />,
  [ADVANCED_SEARCH_TYPES.ORGANIZATIONS]: <OrganizationsTableHead />,
  '': ''
};

const ResultsTableHead = ({ resourceType }) => HEADERS[resourceType];

ResultsTableHead.propTypes = {
  resourceType: PropTypes.oneOf(['', ...Object.values(ADVANCED_SEARCH_TYPES)])
    .isRequired
};

export default ResultsTableHead;
