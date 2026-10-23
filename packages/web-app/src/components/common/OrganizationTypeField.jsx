import { useId } from 'react';
import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { Box, MenuItem, TextField } from '@mui/material';
import {
  getOrganizationTypeLabelId,
  isOrganizationType,
  ORGANIZATION_TYPE_VALUES
} from '@/utils/organizationTypes';
import OrganizationIcon from './OrganizationIcon';

const OrganizationTypeField = ({ control, name, disabled = false }) => {
  const { formatMessage } = useIntl();
  const id = useId();

  return (
    <Controller
      name={name}
      control={control}
      shouldUnregister
      rules={{
        validate: value =>
          isOrganizationType(value) ||
          formatMessage({ id: 'organizationType.required' })
      }}
      render={({ field, fieldState }) => (
        <TextField
          id={id}
          select
          fullWidth
          required
          name={field.name}
          value={isOrganizationType(field.value) ? field.value : ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          disabled={disabled}
          error={!!fieldState.error}
          label={formatMessage({ id: 'organizationType.label' })}
          helperText={fieldState.error?.message}
          data-testid="organization-type-field">
          {ORGANIZATION_TYPE_VALUES.map(type => (
            <MenuItem key={type} value={type} data-testid={`type-${type}`}>
              <Box
                component="span"
                sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <OrganizationIcon organizationType={type} size={24} />
                {formatMessage({ id: getOrganizationTypeLabelId(type) })}
              </Box>
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
};

OrganizationTypeField.propTypes = {
  control: PropTypes.shape({}).isRequired,
  name: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

export default OrganizationTypeField;
