import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';

import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';

import GuidelinePropTypes from '../../../../types/guideline.type';

const getDefaultValues = language => ({
  title: '',
  description: '',
  language
});

const GuidelineForm = ({
  closeForm,
  onSubmit,
  values,
  isNew
}) => {
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  const { formatMessage } = useIntl();

  // When editing, normalize the language field to its ID since the API returns
  // a full language object but the backend expects just the language ID string.
  const normalizedValues = values
    ? { ...values, language: values.language?.id ?? values.language }
    : undefined;

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: normalizedValues ?? getDefaultValues(AVAILABLE_LANGUAGES[locale].id)
  });

  const isTitleLengthValid = value => !value || value.length <= 150;

  const isDescriptionLengthValid = value => !value || value.length <= 500;

  return (
    <FormContainer sx={{ marginTop: 2 }}>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <FormRow>
          <InputText
            formKey="title"
            labelName="guidelines.title"
            control={control}
            isError={!!errors?.title}
            isRequired
            validatorFn={isTitleLengthValid}
            helperText={errors?.title ? formatMessage({ id: 'Title must be less than 150 characters.' }) : undefined}
          />

          <InputLanguage
            formKey="language"
            control={control}
            isError={!!errors?.language}
          />
        </FormRow>
        <InputText
          formKey="description"
          labelName="guidelines.description"
          minRows={3}
          control={control}
          isError={!!errors?.description}
          validatorFn={isDescriptionLengthValid}
          helperText={errors?.description ? formatMessage({ id: 'Description must be less than 500 characters.' }) : undefined}
        />

        <FormActionRow
          isNew={isNew}
          isSubmitting={isSubmitting}
          onCancel={closeForm}
          isCenter
        />
      </form>
    </FormContainer>
  );
};

GuidelineForm.propTypes = {
  closeForm: PropTypes.func.isRequired,
  isNew: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: GuidelinePropTypes
};

export default GuidelineForm;
