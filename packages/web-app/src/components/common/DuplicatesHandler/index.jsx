/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import EntrancesHandler from './EntrancesHandler';
import DocumentsHandler from './DocumentsHandler';

const DuplicatesHandler = ({
  duplicateType,
  duplicate1,
  duplicate2,
  handleSubmit,
  handleNotDuplicatesSubmit,
  titleDuplicate1 = 'Duplicate 1',
  titleDuplicate2 = 'Duplicate 2'
}) => {
  switch (duplicateType) {
    case 'entrance':
      return (
        <EntrancesHandler
          duplicate1={duplicate1}
          duplicate2={duplicate2}
          handleSubmit={handleSubmit}
          handleNotDuplicatesSubmit={handleNotDuplicatesSubmit}
          title1={titleDuplicate1}
          title2={titleDuplicate2}
        />
      );
    case 'document':
      return (
        <DocumentsHandler
          duplicate1={duplicate1}
          duplicate2={duplicate2}
          handleSubmit={handleSubmit}
          handleNotDuplicatesSubmit={handleNotDuplicatesSubmit}
          title1={titleDuplicate1}
          title2={titleDuplicate2}
        />
      );
    default:
      return <></>;
  }
};

export default DuplicatesHandler;

DuplicatesHandler.propTypes = {
  duplicateType: PropTypes.oneOf(['entrance', 'document']).isRequired,
  duplicate1: PropTypes.object.isRequired,
  duplicate2: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleNotDuplicatesSubmit: PropTypes.func.isRequired,
  titleDuplicate1: PropTypes.string,
  titleDuplicate2: PropTypes.string
};
