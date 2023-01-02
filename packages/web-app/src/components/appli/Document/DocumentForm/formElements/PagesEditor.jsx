import React, { useContext, useMemo, useEffect } from 'react';
import styled from 'styled-components';

import { Typography } from '@mui/material';
import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';
import NumberInput from '../../../../common/Form/NumberInput';
import checkDocumentPages, {
  PageError
} from '../../../../../helpers/validateDocumentPages';

const InlineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const InputWrapper = styled.div`
  flex: 1;
`;

const IntervalErrorWrapper = styled.div`
  width: 100%;
`;

const PageIntervalWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const PagesEditor = () => {
  const [intervalError, setIntervalError] = React.useState('');
  const [positiveEndError, setPositiveEndError] = React.useState('');
  const [positiveStartError, setPositiveStartError] = React.useState('');
  const {
    docAttributes: { endPage, authorComment, startPage },
    updateAttribute
  } = useContext(DocumentFormContext);

  useEffect(() => {
    const errors = checkDocumentPages(startPage, endPage);
    setPositiveEndError(errors.find(e => e === PageError.END_POSITIVE) || '');
    setPositiveStartError(
      errors.find(e => e === PageError.START_POSITIVE) || ''
    );
    setIntervalError(errors.find(e => e === PageError.INTERVAL) || '');
  }, [startPage, endPage, intervalError, positiveEndError, positiveStartError]);

  const handleValueChange = (contextValueName, newValue) => {
    updateAttribute(contextValueName, newValue);
  };

  const memoizedValues = [
    endPage,
    authorComment,
    startPage,
    intervalError,
    positiveEndError,
    positiveStartError
  ];
  return useMemo(
    () => (
      <InlineWrapper>
        <PageIntervalWrapper>
          {intervalError !== '' && (
            <IntervalErrorWrapper>
              <Typography align="center" color="error">
                <Translate>{intervalError}</Translate>
              </Typography>
            </IntervalErrorWrapper>
          )}
          <InputWrapper>
            {positiveStartError !== '' && (
              <Typography align="center" color="error">
                <Translate>{positiveStartError}</Translate>
              </Typography>
            )}
            <NumberInput
              hasError={positiveStartError !== '' || intervalError !== ''}
              helperText="Page where the document starts if it's part of another document (ex: an article in a magazine). Leave it blank if you just want to mention the total number of pages (ex: a book)."
              onValueChange={newValue =>
                handleValueChange('startPage', newValue)
              }
              value={startPage}
              valueName="Start Page"
            />
          </InputWrapper>
          <InputWrapper>
            {positiveEndError !== '' && (
              <Typography align="center" color="error">
                <Translate>{positiveEndError}</Translate>
              </Typography>
            )}
            <NumberInput
              hasError={positiveEndError !== '' || intervalError !== ''}
              helperText="Page where the document ends if it's part of another document (ex: an article in a magazine)."
              onValueChange={newValue => handleValueChange('endPage', newValue)}
              value={endPage}
              valueName="End Page"
            />
          </InputWrapper>
        </PageIntervalWrapper>
      </InlineWrapper>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    memoizedValues
  );
};

PagesEditor.propTypes = {};

export default PagesEditor;
