import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';

import { INTEREST_LEVELS, EASE_LEVELS } from '@/utils/visitRatingLevels';
import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';
import RatingInput from '../utils/RatingInput';
import DurationInput from './DurationInput';

import { durationStringToMinutes } from '../../../../utils/dateTimeDuration';
import { CommentPropTypes } from '../../../../types/entrance.type';

const InputDuration = ({ control, formKey, labelId, helperId, icon }) => (
  <Controller
    control={control}
    name={formKey}
    render={({ field: { onChange, value } }) => (
      <DurationInput
        labelId={labelId}
        helperId={helperId}
        icon={icon}
        value={value}
        onChange={onChange}
      />
    )}
  />
);
InputDuration.propTypes = {
  control: PropTypes.shape({}).isRequired,
  formKey: PropTypes.string.isRequired,
  labelId: PropTypes.string.isRequired,
  helperId: PropTypes.string,
  icon: PropTypes.oneOf(['time_to_go', 'underground_time']).isRequired
};

const InputRating = ({
  control,
  formKey,
  labelId,
  descriptionIds,
  precision = 0.5
}) => (
  <Controller
    control={control}
    name={formKey}
    render={({ field: { onChange, value } }) => (
      <RatingInput
        labelId={labelId}
        value={value}
        onChange={onChange}
        descriptionIds={descriptionIds}
        precision={precision}
        valueMultiplier={2}
      />
    )}
  />
);
InputRating.propTypes = {
  control: PropTypes.shape({}).isRequired,
  formKey: PropTypes.string.isRequired,
  labelId: PropTypes.string.isRequired,
  descriptionIds: PropTypes.arrayOf(PropTypes.string),
  precision: PropTypes.number
};

const getDefaultValues = (values, language) => {
  if (values) {
    return {
      ...values,
      eTTrail: durationStringToMinutes(values.eTTrail),
      eTUnderground: durationStringToMinutes(values.eTUnderground)
    };
  }

  return {
    title: '',
    body: '',
    aestheticism: null,
    caving: null,
    approach: null,
    eTTrail: null,
    eTUnderground: null,
    language
  };
};

const CreateCommentForm = ({ closeForm, onSubmit, values, isNewComment }) => {
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: getDefaultValues(values, AVAILABLE_LANGUAGES[locale].id)
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
          labelName="Describe your visit and the highlights."
          minRows={3}
          control={control}
          isError={!!errors?.body}
          isRequired
        />

        <Box sx={{ mt: 2, maxWidth: '48rem', display: 'grid', gap: 1.25 }}>
          <InputDuration
            control={control}
            formKey="eTTrail"
            labelId="Approach time"
            helperId="From parking to entrance"
            icon="time_to_go"
          />
          <InputDuration
            control={control}
            formKey="eTUnderground"
            labelId="Underground time"
            icon="underground_time"
          />
          <Box sx={{ mt: 1 }}>
            <InputRating
              control={control}
              formKey="aestheticism"
              labelId="Interest of the visit"
              descriptionIds={INTEREST_LEVELS}
              precision={(values?.aestheticism ?? 0) % 2 === 1 ? 0.5 : 1}
            />
          </Box>
          <InputRating
            control={control}
            formKey="caving"
            labelId="Ease of move"
            descriptionIds={EASE_LEVELS}
            precision={(values?.caving ?? 0) % 2 === 1 ? 0.5 : 1}
          />
          <InputRating
            control={control}
            formKey="approach"
            labelId="Ease of reach"
            descriptionIds={EASE_LEVELS}
            precision={(values?.approach ?? 0) % 2 === 1 ? 0.5 : 1}
          />
        </Box>

        <FormActionRow
          isNew={isNewComment}
          isSubmitting={isSubmitting}
          onCancel={closeForm}
          isCenter
        />
      </form>
    </FormContainer>
  );
};

CreateCommentForm.propTypes = {
  closeForm: PropTypes.func,
  isNewComment: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: CommentPropTypes
};

export default CreateCommentForm;
