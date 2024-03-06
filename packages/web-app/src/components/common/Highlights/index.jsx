import React from 'react';
import PropTypes from 'prop-types';
import { diffChars, diffSentences } from 'diff';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';

const AddedText = styled('span')`
  background-color: rgb(70, 149, 74, 0.4);
`;

const RemovedText = styled('span')`
  background-color: rgb(229, 83, 74, 0.4);
`;
const UnchangedText = styled('span')``;

const HighLightsChar = ({ oldText, newText }) => {
  if (isNil(oldText)) {
    return <UnchangedText>{newText}</UnchangedText>;
  }
  if (isNil(newText)) {
    return <UnchangedText>{oldText}</UnchangedText>;
  }

  const result = diffChars(newText, oldText);
  return result.map(change => {
    if (change.added) {
      return <AddedText>{change.value}</AddedText>;
    }
    if (change.removed) {
      return <RemovedText>{change.value}</RemovedText>;
    }
    return <UnchangedText>{change.value}</UnchangedText>;
  });
};

const HighLightsLine = ({ oldText, newText }) => {
  if (isNil(oldText)) {
    return <UnchangedText>{newText}</UnchangedText>;
  }
  if (isNil(newText)) {
    return <UnchangedText>{oldText}</UnchangedText>;
  }

  const result = diffSentences(newText, oldText);
  return result.map(change => {
    if (change.added) {
      return (
        <>
          <br />
          <AddedText> + {change.value}</AddedText>
        </>
      );
    }
    if (change.removed) {
      return (
        <>
          <br />
          <RemovedText> - {change.value}</RemovedText>
        </>
      );
    }
    return <UnchangedText>{change.value}</UnchangedText>;
  });
};

HighLightsChar.propTypes = {
  newText: PropTypes.string,
  oldText: PropTypes.string
};
HighLightsLine.propTypes = {
  newText: PropTypes.string,
  oldText: PropTypes.string
};

export { HighLightsChar, HighLightsLine };
