import {
  FormControl as MuiFormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { React } from 'react';
import { Controller /* useWatch */ } from 'react-hook-form'; // To uncomment when API will accept phone number
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
// import PhoneInput from 'react-phone-input-2'; // To uncomment when API will accept phone number
import Translate from '../../../common/Translate';
// import { useDebounce } from '../../../../hooks'; // To uncomment when API will accept phone number
// import 'react-phone-input-2/lib/style.css'; // To uncomment when API will accept phone number

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)};
`;

const InformationForm = ({ control, errors, allCountries }) => {
  const { formatMessage } = useIntl(); // To uncomment when API will accept phone number

  /* const debouncedPhone = useDebounce(
    useWatch({ control, name: 'organization.phone' }),
    300
  ); */

  const validateZipCode = value => {
    if (value && value.isNan) {
      return formatMessage({ id: 'Must be a number' });
    }
    return true;
  };

  return (
    <div>
      <FormControl component="fieldset" style={{ width: '50vh' }}>
        <FormLabel>{formatMessage({ id: 'Additional information' })}</FormLabel>
        <Controller
          name="organization.address"
          control={control}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              error={!!errors?.organization?.address}
              label={formatMessage({ id: 'Address' })}
              inputRef={ref}
              onChange={onChange}
              {...field}
            />
          )}
        />

        {/* To uncomment when api will have addressLine2 field 
        <Controller
          name="organization.addressLine2"
          control={control}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              error={!!errors?.organization?.addressLine2}
              label={formatMessage({ id: 'Address (line 2)' })}
              inputRef={ref}
              onChange={onChange}
              {...field}
            />
          )}
        />
         */}
        <Controller
          name="organization.zipCode"
          control={control}
          rules={{
            validate: validateZipCode
          }}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              type="number"
              fullWidth
              error={!!errors?.organization?.zipCode}
              label={formatMessage({ id: 'Zip code' })}
              inputRef={ref}
              onChange={onChange}
              {...field}
            />
          )}
        />
        <Controller
          name="organization.city"
          control={control}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              error={!!errors?.organization?.city}
              label={formatMessage({ id: 'City' })}
              inputRef={ref}
              onChange={onChange}
              {...field}
            />
          )}
        />
        <Controller
          name="organization.country"
          control={control}
          render={({ field: { ref, ...field } }) => (
            <FormControl error={!!errors?.organization?.country} fullWidth>
              <InputLabel shrink>
                <Translate>Country</Translate>
              </InputLabel>
              <Select {...field} inputRef={ref}>
                <MenuItem key={-1} value={-1} disabled>
                  <i>
                    <Translate>Select a country</Translate>
                  </i>
                </MenuItem>
                {allCountries.map(l => (
                  <MenuItem key={l.value} value={l.value} name={l.label}>
                    <Translate>{l.label}</Translate>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        {/* To uncomment when API will accept phone number
        <Controller
          name="organization.phone"
          control={control}
          render={({ field: { onChange } }) => (
            <FormControl error={!!errors?.organization?.phone}>
              <PhoneInput
                value={debouncedPhone || ''}
                country=""
                onChange={onChange}
              />
            </FormControl>
          )}
        />
        */}
        <Controller
          name="organization.mail"
          control={control}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              error={!!errors?.organization?.mail}
              label={formatMessage({ id: 'Mail' })}
              inputRef={ref}
              onChange={onChange}
              type="email"
              {...field}
            />
          )}
        />
        <Controller
          name="organization.url"
          control={control}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              error={!!errors?.organization?.url}
              label={formatMessage({ id: 'URL' })}
              inputRef={ref}
              onChange={onChange}
              type="url"
              {...field}
            />
          )}
        />
      </FormControl>
    </div>
  );
};
InformationForm.propTypes = {
  allCountries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    organization: PropTypes.shape({
      country: PropTypes.shape({ message: PropTypes.string }),
      address: PropTypes.shape({ message: PropTypes.string }),
      addressLine2: PropTypes.shape({ message: PropTypes.string }),
      zipCode: PropTypes.shape({ message: PropTypes.string }),
      city: PropTypes.shape({ message: PropTypes.string }),
      phone: PropTypes.shape({ message: PropTypes.string }),
      mail: PropTypes.shape({ message: PropTypes.string }),
      url: PropTypes.shape({ message: PropTypes.string })
    })
  })
};

export default InformationForm;
