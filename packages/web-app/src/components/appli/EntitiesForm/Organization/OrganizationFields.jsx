import PropTypes from 'prop-types';
import OrganizationTypeField from '@/components/common/OrganizationTypeField';

import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import {
  validateOrganizationName,
  validateOrganizationUrl,
  validateOrganizationEmail
} from './validation';
import InputText from '../utils/InputText';
import InputCountry from '../utils/InputCountry';
import InputLanguage from '../utils/InputLanguage';
import CoordinateFormSection from '../utils/CoordinateFormSection';
import { FormRow, FormSectionLabel } from '../utils/FormContainers';

// The full editor owns its layout; contextual creation shares validation,
// while keeping its compact five-field composition.
const OrganizationFields = ({ control, errors }) => (
  <>
    <FormSectionLabel label="Basic Information" />
    <FormRow>
      <InputText
        formKey="organization.name"
        labelName="Organization name"
        testId="organization-name"
        control={control}
        isError={!!errors?.organization?.name}
        isRequired
        maxLength={TEXT_LENGTH_LIMITS.ENTITY_NAME}
        validatorFn={validateOrganizationName}
      />

      <InputLanguage
        formKey="organization.language"
        control={control}
        isError={!!errors?.organization?.language}
      />
    </FormRow>

    <OrganizationTypeField control={control} name="organization.type" />

    <InputText
      formKey="organization.customMessage"
      labelName="Custom message"
      control={control}
      isError={!!errors?.organization?.customMessage}
      minRows={6}
      characterLimit={TEXT_LENGTH_LIMITS.ORGANIZATION_MESSAGE}
    />

    <FormSectionLabel label="Additional information" />
    <FormRow>
      <InputText
        formKey="organization.mail"
        labelName="Email"
        control={control}
        isError={!!errors?.organization?.mail}
        type="email"
        validatorFn={validateOrganizationEmail}
        maxLength={TEXT_LENGTH_LIMITS.EMAIL}
      />
      <InputText
        formKey="organization.url"
        labelName="URL"
        control={control}
        isError={!!errors?.organization?.url}
        type="url"
        validatorFn={validateOrganizationUrl}
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
      <InputCountry
        control={control}
        formKey="organization.country"
        isRequired={false}
      />
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

OrganizationFields.propTypes = {
  control: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({
    organization: PropTypes.objectOf(
      PropTypes.shape({ message: PropTypes.string })
    )
  })
};

export default OrganizationFields;
