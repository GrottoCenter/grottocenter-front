import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';

import { updatePerson } from '../../../../actions/Person/UpdatePerson';
import { postChangePassword } from '../../../../actions/Person/ChangePassword';
import { postChangeEmail } from '../../../../actions/Person/ChangeEmail';
import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputPassword from '../utils/InputPassword';
import FormProgressInfo from '../utils/FormProgressInfo';
import { PASSWORD_MIN_LENGTH } from '../../../../conf/config';
import { PersonPropTypes } from '../../../../types/person.type';

export const PersonForm = ({ personValues, isOurAccount }) => {
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
    watch,
    getValues,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      person: {
        name: personValues.name ?? '',
        surname: personValues.surname ?? '',
        nickname: personValues.nickname ?? '',
        email: '',
        emailConfirmation: '',
        password: '',
        passwordConfirmation: ''
      }
    }
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleReset = useCallback(() => {
    reset({ person: personValues });
  }, [personValues, reset]);

  const onSubmit = async ({ person }) => {
    dispatch(
      updatePerson(personValues.id, {
        name: person.name,
        surname: person.surname,
        nickname: person.nickname
      })
    );

    if (person.email && isOurAccount) {
      dispatch(postChangeEmail(person.email));
    }
    if (person.password && isOurAccount) {
      dispatch(postChangePassword(person.password));
    }
  };

  if (isSubmitSuccessful) {
    return (
      <FormProgressInfo
        isLoading={personIsLoading || !personData}
        isError={!!personError}
        labelLoading="Updating person..."
        labelError="'An error occurred when updating'"
        resetFn={handleReset}
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
            labelName="Name"
            control={control}
            isError={!!errors?.person?.name}
            isRequired
          />
          <InputText
            formKey="person.surname"
            labelName="Surname"
            control={control}
            isError={!!errors?.person?.surname}
            isRequired
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
                validatorFn={(value, formatMessage) => {
                  if (value !== getValues()?.person?.email)
                    return formatMessage({ id: 'The mails do not match' });
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
                validatorFn={(value, formatMessage) => {
                  if (value && value.length < PASSWORD_MIN_LENGTH)
                    return formatMessage({ id: 'Password too short.' });
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
                validatorFn={(value, formatMessage) => {
                  if (value !== getValues()?.person?.password)
                    return formatMessage({ id: 'The passwords do not match' });
                  return true;
                }}
                helperText={errors?.person?.passwordConfirmation?.message}
              />
            </FormRow>
          </>
        )}

        <FormActionRow
          isDirty={isDirty}
          isNew={false}
          isSubmitting={isSubmitting}
          onReset={handleReset}
        />
      </form>
    </FormContainer>
  );
};

PersonForm.propTypes = {
  isOurAccount: PropTypes.bool,
  personValues: PersonPropTypes.isRequired
};

export default PersonForm;
