import React from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Typography,
  IconButton,
  InputAdornment
} from '@mui/material';
import Rating from '@mui/material/Rating';
import { Controller, useForm } from 'react-hook-form';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';

import { durationStringToMinutes } from '../../../../util/dateTimeDuration';
import { CommentPropTypes } from '../../../../types/entrance.type';

const InputMinutes = ({ control, formKey, labelName, helperText }) => {
  const { formatMessage } = useIntl();
  return (
    <Controller
      control={control}
      name={formKey}
      render={({ field: { onChange, value } }) => (
        <TextField
          type="number"
          min="1"
          step="1"
          fullWidth
          helperText={formatMessage({ id: helperText })}
          label={formatMessage({ id: labelName })}
          onChange={onChange}
          onKeyPress={e => !/\d/.test(e.key) && e.preventDefault()}
          style={{ mb: 2 }}
          value={value}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">minutes</InputAdornment>
            )
          }}
        />
      )}
    />
  );
};
InputMinutes.propTypes = {
  control: PropTypes.shape({}).isRequired,
  formKey: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired
};

const InputRating = ({ control, formKey, labelName }) => {
  const { formatMessage } = useIntl();
  return (
    <Controller
      control={control}
      name={formKey}
      render={({ field: { onChange, value } }) => (
        <Box display="flex">
          <div>
            <Typography>{formatMessage({ id: labelName })}</Typography>
            <Rating
              name={labelName}
              value={value / 2}
              precision={0.5}
              size="large"
              onChange={(event, newValue) => {
                onChange(newValue !== null ? +newValue * 2 : null);
              }}
              emptyIcon={<StarBorderIcon fontSize="inherit" />}
            />
          </div>
          {value !== null && (
            <div>
              <Typography variant="subtitle2" gutterBottom>
                {formatMessage({ id: 'Clear' })}
              </Typography>
              <IconButton
                onClick={() => {
                  onChange(null);
                }}
                color="primary"
                aria-label="clear rate"
                component="label"
                size="small">
                <NotInterestedIcon />
              </IconButton>
            </div>
          )}
          {value === null && (
            <Box
              display="flex"
              justifyContent="center"
              flexDirection="column"
              style={{ mt: 3 }}>
              <Typography variant="caption">
                {formatMessage({ id: 'No Rating' })}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    />
  );
};
InputRating.propTypes = {
  control: PropTypes.shape({}).isRequired,
  formKey: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired
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

        <FormRow>
          <InputMinutes
            control={control}
            formKey="eTTrail"
            labelName="Access duration"
            helperText="Number of minutes between parking and entrance"
          />
          <InputMinutes
            control={control}
            formKey="eTUnderground"
            labelName="Underground time"
            helperText="Number of minutes spent underground"
          />
        </FormRow>
        <FormRow>
          <InputRating
            control={control}
            formKey="aestheticism"
            labelName="Interest"
          />
          <InputRating
            control={control}
            formKey="caving"
            labelName="Progression"
          />
          <InputRating
            control={control}
            formKey="approach"
            labelName="Access"
          />
        </FormRow>

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
