import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

import Translate from '../../../../common/Translate';
import { loadSubjects } from '../../../../../actions/Subject';
import {
  SUBJECT_DEPTH_STYLES,
  getSubjectCode,
  sortSubjects
} from '../../../../../hooks/subjectHelpers';

import MultipleSelectWithOptionsComponent from './MultipleSelectWithOptions';

const MultipleSubjectsSelect = ({
  computeHasError,
  contextValueName,
  helperText,
  labelName,
  required = false
}) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { isFetching, subjects } = useSelector(state => state.subject);

  const sortedSubjects = useMemo(() => sortSubjects(subjects), [subjects]);

  useEffect(() => {
    dispatch(loadSubjects());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSubjectLabel = option => {
    const code = getSubjectCode(option);
    return `${code} ${formatMessage({ id: code, defaultMessage: option.subject })}`;
  };

  const renderSubjectOption = (props, option) => {
    const code = getSubjectCode(option);
    const depth = code.split('.').length - 1;
    return (
      <Box component="li" {...props} sx={SUBJECT_DEPTH_STYLES[Math.min(depth, 3)]}>
        {code}&nbsp;&nbsp;{formatMessage({ id: code, defaultMessage: option.subject })}
      </Box>
    );
  };

  return (
    <MultipleSelectWithOptionsComponent
      computeHasError={computeHasError}
      contextValueName={contextValueName}
      getOptionLabel={getSubjectLabel}
      getOptionSelected={(optionToTest, valueToTest) =>
        (optionToTest.code && optionToTest.code === valueToTest.code) ||
        (optionToTest.id && optionToTest.id === valueToTest.id)
      }
      helperText={helperText}
      isLoading={isFetching}
      labelName={labelName}
      noOptionsText={
        <Translate>No subject matches you search criteria</Translate>
      }
      options={sortedSubjects}
      renderOption={renderSubjectOption}
      required={required}
    />
  );
};

MultipleSubjectsSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool
};

export default MultipleSubjectsSelect;
