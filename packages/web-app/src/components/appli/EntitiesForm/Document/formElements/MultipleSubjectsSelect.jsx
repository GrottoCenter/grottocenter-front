import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import Translate from '../../../../common/Translate';
import { loadSubjects } from '../../../../../actions/Subject';

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

  useEffect(() => {
    dispatch(loadSubjects());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MultipleSelectWithOptionsComponent
      computeHasError={computeHasError}
      contextValueName={contextValueName}
      getOptionLabel={option => {
        const subjectName = formatMessage({
          id: option.id ?? option.code, // API return with Id but elastic search return code
          defaultMessage: option.subject
        });
        let parentText = '';
        if (option.parent) {
          // Indent if there is a parent.
          parentText = '\u00a0\u00a0\u00a0\u00a0';
        }
        return `${parentText} ${option.id ?? option.code} ${subjectName}`;
      }}
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
      options={subjects}
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
