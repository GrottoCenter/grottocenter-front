import React from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment
} from '@material-ui/core';
import Rating from '@material-ui/lab/Rating';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';
import { isNil } from 'ramda';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import StarBorderIcon from '@material-ui/icons/StarBorder';

import LanguageAutoComplete from '../LanguageAutoComplete';
import { commentType } from '../../Entry/Provider';
import { durationStringToMinutes } from '../../../../util/dateTimeDuration';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(1)}px;`}
`;

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
    interestRate: null,
    progressionRate: null,
    accessRate: null,
    eTTrail: null,
    eTUnderground: null,
    language
  };
};

const CreateCommentForm = ({ closeForm, onSubmit, values, isNewComment }) => {
  const { formatMessage } = useIntl();
  const { languageObject } = useSelector(state => state.intl);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: getDefaultValues(values, languageObject)
  });
  const resetToDefault = () => {
    reset(getDefaultValues(values, languageObject));
  };

  return (
    <Box
      autoComplete="off"
      component="form"
      textAlign="center"
      onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="title"
        rules={{ required: true }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            error={!!error}
            fullWidth
            helperText={
              error ? formatMessage({ id: 'A title is required.' }) : ''
            }
            label={formatMessage({ id: 'Title' })}
            onChange={onChange}
            required
            sx={{ mb: 2 }}
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="body"
        rules={{ required: true }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            error={!!error}
            fullWidth
            multiline
            minRows={3}
            helperText={
              error ? formatMessage({ id: 'A text is required.' }) : ''
            }
            label={formatMessage({ id: 'Text' })}
            onChange={onChange}
            required
            sx={{ mb: 2 }}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="language"
        rules={{ required: true }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <LanguageAutoComplete
            hasError={!isNil(error)}
            helperContent={formatMessage({
              id: 'The title and text language'
            })}
            labelText="Language"
            onSelection={onChange}
            searchLabelText={formatMessage({ id: 'Search a language' })}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="eTTrail"
        render={({ field: { onChange, value } }) => (
          <TextField
            type="number"
            min="1"
            step="1"
            fullWidth
            helperText={formatMessage({
              id: 'Number of minutes between parking and entrance'
            })}
            label={formatMessage({ id: 'Access duration' })}
            onChange={onChange}
            onKeyPress={e => !/\d/.test(e.key) && e.preventDefault()}
            sx={{ mb: 2 }}
            value={value}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">minutes</InputAdornment>
              )
            }}
          />
        )}
      />
      <Controller
        control={control}
        name="eTUnderground"
        render={({ field: { onChange, value } }) => (
          <TextField
            type="number"
            min="1"
            step="1"
            fullWidth
            helperText={formatMessage({
              id: 'Number of minutes spent underground'
            })}
            label={formatMessage({ id: 'Underground time' })}
            onChange={onChange}
            onKeyPress={e => !/\d/.test(e.key) && e.preventDefault()}
            sx={{ mb: 2 }}
            value={value}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">minutes</InputAdornment>
              )
            }}
          />
        )}
      />
      <Controller
        control={control}
        name="interestRate"
        render={({ field: { onChange, value } }) => (
          <Box display="flex">
            <div>
              <Typography>{formatMessage({ id: 'Interest' })}</Typography>
              <Rating
                name="interestRate"
                value={value}
                precision={0.5}
                size="large"
                onChange={(event, newValue) => {
                  onChange(newValue !== null ? +newValue : null);
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
                sx={{ mt: 3 }}>
                <Typography variant="caption">
                  {formatMessage({ id: 'No Rating' })}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      />
      <Controller
        control={control}
        name="progressionRate"
        render={({ field: { onChange, value } }) => (
          <Box display="flex">
            <div>
              <Typography>{formatMessage({ id: 'Progression' })}</Typography>
              <Rating
                name="progressionRate"
                value={value}
                precision={0.5}
                size="large"
                onChange={(event, newValue) => {
                  onChange(newValue !== null ? +newValue : null);
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
                sx={{ mt: 3 }}>
                <Typography variant="caption">
                  {formatMessage({ id: 'No Rating' })}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      />
      <Controller
        control={control}
        name="accessRate"
        render={({ field: { onChange, value } }) => (
          <Box display="flex">
            <div>
              <Typography>{formatMessage({ id: 'Access' })}</Typography>
              <Rating
                name="accessRate"
                value={value}
                precision={0.5}
                size="large"
                onChange={(event, newValue) => {
                  onChange(newValue !== null ? +newValue : null);
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
                sx={{ mt: 3 }}>
                <Typography variant="caption">
                  {formatMessage({ id: 'No Rating' })}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      />

      {closeForm && (
        <SpacedButton onClick={closeForm}>
          {formatMessage({ id: 'Cancel' })}
        </SpacedButton>
      )}
      <SpacedButton onClick={resetToDefault}>
        {formatMessage({ id: 'Reset' })}
      </SpacedButton>
      <SpacedButton
        color="primary"
        type="submit"
        onClick={handleSubmit(onSubmit)}
        sx={{ mx: 1 }}>
        {isNewComment
          ? formatMessage({ id: 'Create' })
          : formatMessage({ id: 'Update' })}
      </SpacedButton>
    </Box>
  );
};

CreateCommentForm.propTypes = {
  closeForm: PropTypes.func,
  isNewComment: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: commentType
};

export default CreateCommentForm;
