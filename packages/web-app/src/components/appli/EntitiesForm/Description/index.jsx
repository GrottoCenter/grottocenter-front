import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';

import { DescriptionPropTypes } from '../../../../types/description.type';

const getDefaultValues = language => ({
  title: '',
  body: '',
  language
});

const CreateDescriptionForm = ({
  closeForm,
  onSubmit,
  values,
  isNewDescription
}) => {
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
          <InputText
            formKey="title"
            labelName="Title"
            control={control}
            isError={!!errors?.title}
            isRequired
          />

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
          isNew={isNewDescription}
          isSubmitting={isSubmitting}
          onReset={handleReset}
          onCancel={closeForm}
          isCenter
        />
      </form>
    </FormContainer>
  );
};

CreateDescriptionForm.propTypes = {
  closeForm: PropTypes.func,
  isNewDescription: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: DescriptionPropTypes
};

export default CreateDescriptionForm;
