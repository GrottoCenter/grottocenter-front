import React from 'react';
import PropTypes from 'prop-types';

import { ADVANCED_SEARCH_TYPES } from '../../../../conf/config';

import DocumentsTableHead from './DocumentsTableHead';
import EntrancesTableHead from './EntrancesTableHead';
import MassifsTableHead from './MassifsTableHead';
import OrganizationsTableHead from './OrganizationsTableHead';

const ResultsTableHead = ({ resourceType, showCheckbox, onSelectAll, allSelected }) => {
  const HEADERS = {
    [ADVANCED_SEARCH_TYPES.DOCUMENTS]: <DocumentsTableHead showCheckbox={showCheckbox} onSelectAll={onSelectAll} allSelected={allSelected} />,
    [ADVANCED_SEARCH_TYPES.ENTRANCES]: <EntrancesTableHead showCheckbox={showCheckbox} onSelectAll={onSelectAll} allSelected={allSelected} />,
    [ADVANCED_SEARCH_TYPES.MASSIFS]: <MassifsTableHead showCheckbox={showCheckbox} onSelectAll={onSelectAll} allSelected={allSelected} />,
    [ADVANCED_SEARCH_TYPES.ORGANIZATIONS]: <OrganizationsTableHead showCheckbox={showCheckbox} onSelectAll={onSelectAll} allSelected={allSelected} />,
    '': ''
  };
  
  return HEADERS[resourceType];
};

ResultsTableHead.propTypes = {
  resourceType: PropTypes.oneOf(['', ...Object.values(ADVANCED_SEARCH_TYPES)])
    .isRequired,
  showCheckbox: PropTypes.bool,
  onSelectAll: PropTypes.func,
  allSelected: PropTypes.bool
};

export default ResultsTableHead;
