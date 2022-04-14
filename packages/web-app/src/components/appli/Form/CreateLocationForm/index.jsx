import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Button, TextField } from '@material-ui/core';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';
import { isNil } from 'ramda';

import LanguageAutoComplete from '../LanguageAutoComplete';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(1)}px;`}
`;

const defaultValues = {
  title: '',
  body: '',
  language: null
};
const CreateLocationForm = ({ onSubmit }) => {
  const { formatMessage } = useIntl();
  const { control, handleSubmit, reset } = useForm({
    defaultValues
  });
  const resetToDefault = () => {
    reset(defaultValues);
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

      <SpacedButton
        color="primary"
        type="submit"
        onClick={handleSubmit(onSubmit)}
        sx={{ mx: 1 }}>
        {formatMessage({ id: 'Create' })}
      </SpacedButton>
      <SpacedButton onClick={() => resetToDefault()}>
        {formatMessage({ id: 'Reset' })}
      </SpacedButton>
    </Box>
  );
};

CreateLocationForm.propTypes = { onSubmit: PropTypes.func.isRequired };

export default CreateLocationForm;
