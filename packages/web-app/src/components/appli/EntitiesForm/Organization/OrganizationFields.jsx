import { React } from 'react';
// import { useWatch } from 'react-hook-form'; // To uncomment when API will accept phone number
import PropTypes from 'prop-types';
// import PhoneInput from 'react-phone-input-2'; // To uncomment when API will accept phone number

// import { useDebounce } from '../../../../hooks'; // To uncomment when API will accept phone number
// import 'react-phone-input-2/lib/style.css'; // To uncomment when API will accept phone number

import {
  validateLatitude,
  validateLongitude
} from '../../../../util/validateLatLong';
import InputText from '../utils/InputText';
import InputCountry from '../utils/InputCountry';
import InputLanguage from '../utils/InputLanguage';
import InputCoordinate from '../utils/InputCoordinate';
import MapMarkerSelector from '../utils/MapMarkerSelector';
import { FormRow, FormSectionLabel } from '../utils/FormContainers';
// import OrganizationLogo from './OrganizationLogo';

const OrganizationFields = ({ control, errors, isNewOrganization }) => (
  /* const debouncedPhone = useDebounce(  // To uncomment when API will accept phone number
    useWatch({ control, name: 'organization.phone' }),
    300
  ); */

  <>
    <FormSectionLabel label="Basic Information" />
    <FormRow>
      <InputText
        formKey="organization.name"
        labelName="Organization name"
        control={control}
        isError={!!errors?.organization?.name}
        isRequired
      />

      <InputLanguage
        formKey="organization.language"
        control={control}
        isError={!!errors?.organization?.language}
        disabled={!isNewOrganization}
      />
    </FormRow>

    {/* To uncomment to use description instead of customMessage when API will be ready
        <FormLabel>
          {formatMessage({ id: 'Description of the organization' })}
        </FormLabel>
        <InputText
          formKey="organization.descriptionTitle"
          labelName="Title"
          control={control}
          isError={!!errors?.organization?.descriptionTitle}
          isRequired={true}
        />
        <InputText
          formKey="organization.description"
          labelName="Description"
          control={control}
          isError={!!errors?.organization?.description}
          minRows={6}
          isRequired={true}
        /> */}

    <InputText
      formKey="organization.customMessage"
      labelName="Custom message"
      control={control}
      isError={!!errors?.organization?.customMessage}
      minRows={6}
      isRequired
    />

    <FormSectionLabel label="Additional information" />
    <FormRow>
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

      <InputText
        formKey="organization.mail"
        labelName="Email"
        control={control}
        isError={!!errors?.organization?.mail}
        type="email"
      />
      <InputText
        formKey="organization.url"
        labelName="URL"
        control={control}
        isError={!!errors?.organization?.url}
        type="url"
      />
    </FormRow>
    <InputText
      formKey="organization.address"
      labelName="Address"
      control={control}
      isError={!!errors?.organization?.address}
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

    <FormRow>
      <InputText
        formKey="organization.zipCode"
        labelName="Zip code"
        control={control}
        isError={!!errors?.organization?.zipCode}
      />
      <InputText
        formKey="organization.city"
        labelName="City"
        control={control}
        isError={!!errors?.organization?.city}
      />
      <InputCountry control={control} formKey="organization.country" />
    </FormRow>

    <FormRow>
      <InputCoordinate
        formKey="organization.latitude"
        labelName="Latitude"
        control={control}
        validatorFn={validateLatitude}
        isError={!!errors?.organization?.latitude}
        helperText={errors?.organization?.latitude?.message}
      />
      <InputCoordinate
        formKey="organization.longitude"
        labelName="Longitude"
        control={control}
        validatorFn={validateLongitude}
        isError={!!errors?.organization?.longitude}
        helperText={errors?.organization?.longitude?.message}
      />
    </FormRow>
    <MapMarkerSelector
      control={control}
      formLatitudeKey="organization.latitude"
      formLongitudeKey="organization.longitude"
    />

    {/* <OrganizationLogo control={control} errors={errors} /> To uncomment when api will be ready to store logo */}
  </>
);
OrganizationFields.propTypes = {
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    organization: PropTypes.shape({
      customMessage: PropTypes.shape({ message: PropTypes.string }), // To remove when customMessage switch to description
      description: PropTypes.arrayOf(PropTypes.shape({})),
      descriptionTitle: PropTypes.arrayOf(PropTypes.shape({})),
      language: PropTypes.shape({ message: PropTypes.string }),
      name: PropTypes.shape({ message: PropTypes.string }),
      isPartner: PropTypes.bool,
      country: PropTypes.shape({ message: PropTypes.string }),
      address: PropTypes.shape({ message: PropTypes.string }),
      addressLine2: PropTypes.shape({ message: PropTypes.string }),
      zipCode: PropTypes.shape({ message: PropTypes.string }),
      city: PropTypes.shape({ message: PropTypes.string }),
      phone: PropTypes.shape({ message: PropTypes.string }),
      mail: PropTypes.shape({ message: PropTypes.string }),
      url: PropTypes.shape({ message: PropTypes.string }),
      latitude: PropTypes.shape({ message: PropTypes.string }),
      longitude: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  isNewOrganization: PropTypes.bool
};

export default OrganizationFields;
