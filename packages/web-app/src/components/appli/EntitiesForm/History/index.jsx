import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';

import { HistoryPropTypes } from '../../../../types/entrance.type';

const getDefaultValues = language => ({
  body: '',
  language
});

const CreateHistoryForm = ({ closeForm, onSubmit, values, isNewHistory }) => {
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting }
  } = useForm({
    defaultValues: values ?? getDefaultValues(AVAILABLE_LANGUAGES[locale].id)
  });
  const handleReset = () => {
    reset(values ?? getDefaultValues(AVAILABLE_LANGUAGES[locale].id));
  };

  return (
    <FormContainer sx={{ marginTop: 2 }}>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <FormRow>
          <InputLanguage
            formKey="language"
            control={control}
            isError={!!errors?.language}
          />
        </FormRow>
        <InputText
          formKey="body"
          labelName="Text"
          minRows={3}
          control={control}
          isError={!!errors?.body}
          isRequired
        />

        <FormActionRow
          isDirty={isDirty}
          isNew={isNewHistory}
          isSubmitting={isSubmitting}
          onReset={handleReset}
          onCancel={closeForm}
          isCenter
        />
      </form>
    </FormContainer>
  );
};

CreateHistoryForm.propTypes = {
  closeForm: PropTypes.func,
  isNewHistory: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: HistoryPropTypes
};

export default CreateHistoryForm;
