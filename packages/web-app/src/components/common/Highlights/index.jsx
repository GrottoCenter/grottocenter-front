// `React.Fragment` with a `key` prop needs the React namespace: the automatic
// JSX runtime covers `<>…</>`, which cannot take a key. Do not strip.
import React from 'react';
import PropTypes from 'prop-types';
import { diffWords, diffSentences } from 'diff';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';

const AddedText = styled('span')`
  background-color: rgb(70, 149, 74, 0.4);
  border-radius: 3px;
  padding: 0 2px;
  margin: 0 1px;
`;

const RemovedText = styled('span')`
  background-color: rgb(229, 83, 74, 0.4);
  border-radius: 3px;
  padding: 0 2px;
  margin: 0 1px;
`;
const UnchangedText = styled('span')``;

const HighLightsChar = ({ oldText, newText }) => {
  if (isNil(oldText)) {
    return <UnchangedText>{newText}</UnchangedText>;
  }
  if (isNil(newText)) {
    return <UnchangedText>{oldText}</UnchangedText>;
  }

  const result = diffWords(oldText, newText);
  // A diff chunk has no identity beyond its offset in the result, and the
  // whole list is recomputed from (oldText, newText) on every render.
  /* eslint-disable react/no-array-index-key */
  return result.map((change, index) => {
    if (change.added) {
      return <AddedText key={index}>{change.value}</AddedText>;
    }
    if (change.removed) {
      return <RemovedText key={index}>{change.value}</RemovedText>;
    }
    return <UnchangedText key={index}>{change.value}</UnchangedText>;
  });
};

const HighLightsLine = ({ oldText, newText }) => {
  if (isNil(oldText)) {
    return <UnchangedText>{newText}</UnchangedText>;
  }
  if (isNil(newText)) {
    return <UnchangedText>{oldText}</UnchangedText>;
  }

  const result = diffSentences(oldText, newText);
  // A diff chunk has no identity beyond its offset in the result, and the
  // whole list is recomputed from (oldText, newText) on every render.
  /* eslint-disable react/no-array-index-key */
  return result.map((change, index) => {
    if (change.added) {
      return (
        <React.Fragment key={index}>
          <br />
          <AddedText> + {change.value}</AddedText>
        </React.Fragment>
      );
    }
    if (change.removed) {
      return (
        <React.Fragment key={index}>
          <br />
          <RemovedText> - {change.value}</RemovedText>
        </React.Fragment>
      );
    }
    return <UnchangedText key={index}>{change.value}</UnchangedText>;
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
