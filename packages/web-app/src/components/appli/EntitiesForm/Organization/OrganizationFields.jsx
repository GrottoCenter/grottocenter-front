import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';

import InputText from '../utils/InputText';
import InputCountry from '../utils/InputCountry';
import InputLanguage from '../utils/InputLanguage';
import CoordinateFormSection from '../utils/CoordinateFormSection';
import { FormRow, FormSectionLabel } from '../utils/FormContainers';

const OrganizationFields = ({ control, errors, isNewOrganization }) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <FormSectionLabel label={formatMessage({ id: 'Basic Information' })} />
      <FormRow>
        <InputText
          formKey="organization.name"
          labelName="Organization name"
          control={control}
          isError={!!errors?.organization?.name}
          isRequired
          maxLength={TEXT_LENGTH_LIMITS.ENTITY_NAME}
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
        characterLimit={TEXT_LENGTH_LIMITS.ORGANIZATION_MESSAGE}
      />

      <FormSectionLabel
        label={formatMessage({ id: 'Additional information' })}
      />
      <FormRow>
        <InputText
          formKey="organization.mail"
          labelName="Email"
          control={control}
          isError={!!errors?.organization?.mail}
          type="email"
          maxLength={TEXT_LENGTH_LIMITS.EMAIL}
        />
        <InputText
          formKey="organization.url"
          labelName="URL"
          control={control}
          isError={!!errors?.organization?.url}
          type="url"
          maxLength={TEXT_LENGTH_LIMITS.URL}
        />
      </FormRow>
      <InputText
        formKey="organization.address"
        labelName="Address"
        control={control}
        isError={!!errors?.organization?.address}
        maxLength={TEXT_LENGTH_LIMITS.ADDRESS}
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
          maxLength={TEXT_LENGTH_LIMITS.POSTAL_CODE}
        />
        <InputText
          formKey="organization.city"
          labelName="City"
          control={control}
          isError={!!errors?.organization?.city}
          maxLength={TEXT_LENGTH_LIMITS.CITY}
        />
        <InputCountry control={control} formKey="organization.country" />
      </FormRow>

      <CoordinateFormSection
        control={control}
        formLatitudeKey="organization.latitude"
        formLongitudeKey="organization.longitude"
        latitudeError={errors?.organization?.latitude?.message}
        longitudeError={errors?.organization?.longitude?.message}
      />
    </>
  );
};

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
      mail: PropTypes.shape({ message: PropTypes.string }),
      url: PropTypes.shape({ message: PropTypes.string }),
      latitude: PropTypes.shape({ message: PropTypes.string }),
      longitude: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  isNewOrganization: PropTypes.bool
};

export default OrganizationFields;
