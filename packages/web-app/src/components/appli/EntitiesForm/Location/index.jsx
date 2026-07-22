import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';

import { LocationPropTypes } from '../../../../types/entrance.type';

const getDefaultValues = language => ({
  title: '',
  body: '',
  language
});

const CreateLocationForm = ({ closeForm, onSubmit, values, isNewLocation }) => {
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: values ?? getDefaultValues(AVAILABLE_LANGUAGES[locale].id)
  });

  return (
    <FormContainer sx={{ marginTop: 1 }}>
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
          isNew={isNewLocation}
          isSubmitting={isSubmitting}
          onCancel={closeForm}
          isCenter
        />
      </form>
    </FormContainer>
  );
};

CreateLocationForm.propTypes = {
  closeForm: PropTypes.func,
  isNewLocation: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: LocationPropTypes
};

export default CreateLocationForm;
