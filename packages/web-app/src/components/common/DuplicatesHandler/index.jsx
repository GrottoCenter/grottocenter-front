/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import EntrancesHandler from './EntrancesHandler';
import DocumentsHandler from './DocumentsHandler';
import LabelAdornment from './Common/LabelAdornment';

const DuplicatesHandler = ({
  duplicateType,
  duplicate1,
  duplicate2,
  handleSubmit,
  handleNotDuplicatesSubmit,
  titleDuplicate1 = 'Duplicate 1',
  titleDuplicate2 = 'Duplicate 2'
}) => {
  let handler;
  switch (duplicateType) {
    case 'entrance':
      handler = (
        <EntrancesHandler
          duplicate1={duplicate1}
          duplicate2={duplicate2}
          handleSubmit={handleSubmit}
          handleNotDuplicatesSubmit={handleNotDuplicatesSubmit}
          title1={titleDuplicate1}
          title2={titleDuplicate2}
        />
      );
      break;
    case 'document':
      handler = (
        <DocumentsHandler
          duplicate1={duplicate1}
          duplicate2={duplicate2}
          handleSubmit={handleSubmit}
          handleNotDuplicatesSubmit={handleNotDuplicatesSubmit}
          title1={titleDuplicate1}
          title2={titleDuplicate2}
        />
      );
      break;
    default:
      handler = '';
      break;
  }

  return (
    <>
      <LabelAdornment />
      {handler}
    </>
  );
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
