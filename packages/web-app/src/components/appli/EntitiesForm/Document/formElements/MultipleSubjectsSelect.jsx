import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

import Translate from '../../../../common/Translate';
import {
  SUBJECT_DEPTH_STYLES,
  getSubjectCode,
  sortSubjects
} from '../../../../../utils/subjectHelpers';

import MultipleSelectWithOptionsComponent from './MultipleSelectWithOptions';
import { useSubjects } from '../../../../../hooks';

const MultipleSubjectsSelect = ({
  computeHasError,
  contextValueName,
  helperText,
  labelName,
  required = false
}) => {
  const { formatMessage } = useIntl();
  const { data: subjects = [], isFetching } = useSubjects();

  const sortedSubjects = useMemo(() => sortSubjects(subjects), [subjects]);

  const getSubjectLabel = option => {
    const code = getSubjectCode(option);
    return `${code} ${formatMessage({ id: code, defaultMessage: option.subject })}`;
  };

  const renderSubjectOption = (props, option) => {
    const code = getSubjectCode(option);
    const depth = code.split('.').length - 1;
    return (
      <Box
        component="li"
        {...props}
        sx={SUBJECT_DEPTH_STYLES[Math.min(depth, 3)]}>
        {code}&nbsp;&nbsp;
        {formatMessage({ id: code, defaultMessage: option.subject })}
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
