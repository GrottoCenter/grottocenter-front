import React from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Box, Button, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { styled } from '@mui/material/styles';
import LanguageAutoComplete from '../LanguageAutoComplete';
import { LocationPropTypes } from '../../../../types/entrance.type';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(1)};`}
`;

const getDefaultValues = language => ({
  title: '',
  body: '',
  language
});

const CreateLocationForm = ({ closeForm, onSubmit, values, isNewLocation }) => {
  const { formatMessage } = useIntl();
  const { languageObject } = useSelector(state => state.intl);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: values || getDefaultValues(languageObject)
  });
  const resetToDefault = () => {
    reset(values || getDefaultValues(languageObject));
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
            style={{ mb: 2 }}
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
            style={{ mb: 2 }}
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
            hasError={!!error}
            helperContent={formatMessage({ id: 'The title and text language' })}
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
        style={{ mx: 1 }}>
        {isNewLocation
          ? formatMessage({ id: 'Create' })
          : formatMessage({ id: 'Update' })}
      </SpacedButton>
      <SpacedButton variant="outlined" onClick={resetToDefault}>
        {formatMessage({ id: 'Reset' })}
      </SpacedButton>
      {closeForm && (
        <SpacedButton onClick={closeForm}>
          {formatMessage({ id: 'Cancel' })}
        </SpacedButton>
      )}
    </Box>
  );
};

CreateLocationForm.propTypes = {
  closeForm: PropTypes.func,
  isNewLocation: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: LocationPropTypes
};

export default CreateLocationForm;
