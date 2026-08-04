import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';

import { updatePerson } from '../../../../actions/Person/UpdatePerson';
import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import FormProgressInfo from '../utils/FormProgressInfo';
import { PersonPropTypes } from '../../../../types/person.type';

export const PersonForm = ({ personValues, onCancel }) => {
  const {
    error: personError,
    isLoading: personIsLoading,
    person: personData
  } = useSelector(state => state.updatePerson);

  const dispatch = useDispatch();
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
    dispatch(
      updatePerson(personValues.id, {
        name: person.name,
        surname: person.surname,
        nickname: person.nickname
      })
    );
  };

  if (isSubmitSuccessful) {
    return (
      <FormProgressInfo
        isLoading={personIsLoading || !personData}
        isError={!!personError}
        labelLoading="Updating person..."
        labelError="'An error occurred when updating'"
        resetFn={() =>
          reset(undefined, { keepValues: true, keepErrors: false })
        }
        getRedirectFn={() => `/ui/persons/${personData.id}`}
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
