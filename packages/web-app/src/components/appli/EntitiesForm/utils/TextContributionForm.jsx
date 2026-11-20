import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import { FormContainer, FormActionRow, FormRow } from './FormContainers';
import InputText from './InputText';
import InputLanguage from './InputLanguage';

const TextContributionForm = ({
  closeForm,
  onSubmit,
  values,
  isNew,
  hasTitle = true
}) => {
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: values ?? {
      ...(hasTitle ? { title: '' } : {}),
      body: '',
      language: AVAILABLE_LANGUAGES[locale].id
    }
  });

  return (
    <FormContainer sx={{ mt: 1 }}>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <FormRow>
          {hasTitle && (
            <InputText
              formKey="title"
              maxLength={TEXT_LENGTH_LIMITS.TITLE}
              labelName="Title"
              control={control}
              isError={!!errors?.title}
              isRequired
            />
          )}
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
          isNew={isNew}
          isSubmitting={isSubmitting}
          onCancel={closeForm}
        />
      </form>
    </FormContainer>
  );
};

TextContributionForm.propTypes = {
  closeForm: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  values: PropTypes.shape({
    title: PropTypes.string,
    body: PropTypes.string,
    language: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  }),
  isNew: PropTypes.bool.isRequired,
  hasTitle: PropTypes.bool
};

export default TextContributionForm;
