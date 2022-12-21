import {
  FormControl as MuiFormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel
} from '@material-ui/core';
import { React } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Translate from '../../../common/Translate';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const BasicInformationForm = ({
  control,
  errors,
  allLanguages,
  isNewOrganization
}) => {
  const { formatMessage } = useIntl();

  return (
    <div>
      <FormControl component="fieldset" style={{ width: '50vh' }}>
        <FormLabel>{formatMessage({ id: 'Basic Information' })}</FormLabel>
        <Controller
          name="organization.name"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.organization?.name}
              label={formatMessage({ id: 'Organization name' })}
              inputRef={ref}
              onChange={onChange}
              {...field}
            />
          )}
        />
        <Controller
          name="organization.language"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <FormControl
              required
              error={!!errors?.organization?.language}
              fullWidth>
              <InputLabel shrink>
                <Translate>Language</Translate>
              </InputLabel>
              <Select disabled={!isNewOrganization} {...field} inputRef={ref}>
                <MenuItem key={-1} value={-1} disabled>
                  <i>
                    <Translate>Select a language</Translate>
                  </i>
                </MenuItem>
                {allLanguages.map(l => (
                  <MenuItem key={l.id} value={l.id} name={l.refName}>
                    <Translate>{l.refName}</Translate>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        {/* To uncomment to use description instead of customMessage when API will be ready
        <FormLabel>
          {formatMessage({ id: 'Description of the organization' })}
        </FormLabel>
        <Controller
          name="organization.descriptionTitle"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.organization?.descriptionTitle}
              label={formatMessage({ id: 'Title' })}
              inputRef={ref}
              onChange={onChange}
              {...field}
            />
          )}
        />

       
        <Controller
          name="organization.description"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.organization?.description}
              label={formatMessage({ id: 'Description' })}
              inputRef={ref}
              multiline
              minRows={6}
              onChange={onChange}
              {...field}
            />
          )}
        />
         */}
        <Controller
          name="organization.customMessage"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.organization?.customMessage}
              label={formatMessage({ id: 'Custom message' })}
              inputRef={ref}
              multiline
              minRows={6}
              onChange={onChange}
              {...field}
            />
          )}
        />
      </FormControl>
    </div>
  );
};
BasicInformationForm.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    organization: PropTypes.shape({
      customMessage: PropTypes.shape({ message: PropTypes.string }), // To remove when customMessage switch to description
      description: PropTypes.arrayOf(PropTypes.shape({})),
      descriptionTitle: PropTypes.arrayOf(PropTypes.shape({})),
      language: PropTypes.shape({ message: PropTypes.string }),
      name: PropTypes.shape({ message: PropTypes.string }),
      isPartner: PropTypes.bool
    })
  }),
  isNewOrganization: PropTypes.bool
};

export default BasicInformationForm;
