import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

import { useUpdatePerson } from '../../../../hooks';
import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import FormProgressInfo from '../utils/FormProgressInfo';
import { PersonPropTypes } from '../../../../types/person.type';

export const PersonForm = ({ personValues, onCancel }) => {
  const updateMutation = useUpdatePerson();
  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      person: {
        name: personValues.name ?? '',
        surname: personValues.surname ?? '',
        nickname: personValues.nickname ?? ''
      }
    }
  });

  const onSubmit = ({ person }) => {
    updateMutation.mutate({
      id: personValues.id,
      body: {
        name: person.name,
        surname: person.surname,
        nickname: person.nickname
      }
    });
  };

  if (isSubmitSuccessful) {
    return (
      <FormProgressInfo
        isLoading={updateMutation.isPending || !updateMutation.data}
        isError={updateMutation.isError}
        labelLoading="Updating person..."
        labelError="'An error occurred when updating'"
        resetFn={() =>
          reset(undefined, { keepValues: true, keepErrors: false })
        }
        getRedirectFn={() => `/ui/persons/${updateMutation.data?.id}`}
      />
    );
  }

  return (
    <FormContainer>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <FormRow>
          <InputText
            formKey="person.nickname"
            labelName="Nickname"
            control={control}
            isError={!!errors?.person?.nickname}
            isRequired
          />
        </FormRow>
        <FormRow>
          <InputText
            formKey="person.name"
            labelName="First name"
            control={control}
            isError={!!errors?.person?.name}
          />
          <InputText
            formKey="person.surname"
            labelName="Last name"
            control={control}
            isError={!!errors?.person?.surname}
          />
        </FormRow>

        <FormActionRow
          isNew={false}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
        />
      </form>
    </FormContainer>
  );
};

PersonForm.propTypes = {
  personValues: PersonPropTypes.isRequired,
  onCancel: PropTypes.func
};

export default PersonForm;
