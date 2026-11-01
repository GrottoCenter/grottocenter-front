import { useRef } from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { Controller, useForm } from 'react-hook-form';

import { INTEREST_LEVELS, EASE_LEVELS } from '@/utils/visitRatingLevels';
import FormSubmissionError from '@/components/common/FormSubmissionError';
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

const CreateCommentForm = ({
  closeForm,
  onSubmit,
  values,
  isNewComment,
  error = null,
  explorationStatus = null
}) => {
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  const { formatMessage } = useIntl();
  const isSubmittingRef = useRef(false);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      ...getDefaultValues(values, AVAILABLE_LANGUAGES[locale].id),
      shouldMarkExplored: false
    }
  });

  const handleFormSubmit = async event => {
    if (isSubmittingRef.current) {
      event.preventDefault();
      return;
    }
    isSubmittingRef.current = true;
    try {
      await handleSubmit(onSubmit)(event);
    } catch {
      // The caller's mutation exposes the error below; retain all form values.
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <FormContainer sx={{ marginTop: 1 }}>
      <form
        noValidate
        autoComplete="off"
        data-testid="comment-form"
        aria-busy={isSubmitting}
        onSubmit={handleFormSubmit}>
        <FormSubmissionError error={error} />
        <Box
          component="fieldset"
          disabled={isSubmitting}
          sx={{ m: 0, p: 0, border: 0, minWidth: 0 }}>
          <FormRow>
            <InputText
              formKey="title"
              testId="comment-title"
              maxLength={TEXT_LENGTH_LIMITS.TITLE}
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
            testId="comment-body"
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

          {isNewComment && explorationStatus === 'unexplored' && (
            <Controller
              name="shouldMarkExplored"
              control={control}
              render={({ field: { value, onChange, onBlur, name, ref } }) => (
                <FormControlLabel
                  sx={{ mt: 2 }}
                  control={
                    <Checkbox
                      color="success"
                      name={name}
                      checked={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      slotProps={{
                        input: { ref, 'data-testid': 'comment-mark-explored' }
                      }}
                      disabled={isSubmitting}
                      icon={<CheckCircleOutlinedIcon />}
                      checkedIcon={<CheckCircleIcon />}
                    />
                  }
                  label={formatMessage({
                    id: 'Also add this entrance to my explored entrances'
                  })}
                />
              )}
            />
          )}
          {isNewComment && explorationStatus === 'explored' && (
            <Typography
              variant="body2"
              sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" fontSize="small" />
              {formatMessage({ id: 'Already in my explored entrances' })}
            </Typography>
          )}
        </Box>

        <FormActionRow
          isNew={isNewComment}
          isSubmitting={isSubmitting}
          isCancelDisabled={isSubmitting}
          submitLabel={formatMessage({
            id: isNewComment ? 'Publish my comment' : 'Save'
          })}
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
  error: FormSubmissionError.propTypes.error,
  explorationStatus: PropTypes.oneOf(['explored', 'unexplored']),
  values: CommentPropTypes
};

export default CreateCommentForm;
