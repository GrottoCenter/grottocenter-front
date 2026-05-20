import React from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';

import { updatePerson } from '../../../../actions/Person/UpdatePerson';
import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import FormProgressInfo from '../utils/FormProgressInfo';
import { PersonPropTypes } from '../../../../types/person.type';
import NotificationPreferences from './NotificationPreferences';

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

        {isOurAccount && (
          <>
            <br />
            <FormRow>
              <InputText
                formKey="person.email"
                labelName="Change email"
                control={control}
                isError={!!errors?.person?.email}
                type="email"
              />
              <InputText
                formKey="person.emailConfirmation"
                labelName="Email confirmation"
                control={control}
                isError={!!errors?.person?.emailConfirmation}
                isRequired={!!watch('person.email')}
                type="email"
                validatorFn={(value, intlFormatMessage) => {
                  if (value !== getValues()?.person?.email)
                    return intlFormatMessage({ id: 'The mails do not match' });
                  return true;
                }}
                helperText={errors?.person?.emailConfirmation?.message}
              />
            </FormRow>
            <br />
            <FormRow>
              <InputPassword
                formKey="person.password"
                labelName="Change password"
                isPasswordVisible={isPasswordVisible}
                onShowPassword={() => setIsPasswordVisible(!isPasswordVisible)}
                control={control}
                isError={!!errors?.person?.password}
                validatorFn={(value, intlFormatMessage) => {
                  if (value && value.length < PASSWORD_MIN_LENGTH)
                    return intlFormatMessage({ id: 'Password too short.' });
                  return true;
                }}
                helperText={errors?.person?.password?.message}
              />
              <InputPassword
                formKey="person.passwordConfirmation"
                labelName="Password confirmation"
                isPasswordVisible={isPasswordVisible}
                onShowPassword={() => setIsPasswordVisible(!isPasswordVisible)}
                control={control}
                isError={!!errors?.person?.passwordConfirmation}
                isRequired={!!watch('person.password')}
                validatorFn={(value, intlFormatMessage) => {
                  if (value !== getValues()?.person?.password)
                    return intlFormatMessage({
                      id: 'The passwords do not match'
                    });
                  return true;
                }}
                helperText={errors?.person?.passwordConfirmation?.message}
              />
            </FormRow>
            
            <NotificationPreferences />
          </>
        )}

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
