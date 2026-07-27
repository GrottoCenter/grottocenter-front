import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { isPasswordValid, isValidEmail } from '../../conf/config';
import { localeToLanguageId } from '../../utils/languageMapping';
import { postSignUp } from '../../actions/SignUp';
import { useNotification, usePermissions } from '../../hooks';
import SignUpForm from '../../pages/SignUpForm';

const captchaSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const SignUp = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const signUpState = useSelector(state => state.signUp);
  const { locale } = useSelector(state => state.intl);
  const [signUpRequestSent, setSignUpRequestSent] = React.useState(false);
  const [signUpRequestSucceeded, setSignUpRequestSucceeded] =
    React.useState(false);
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirmation, setPasswordConfirmation] = React.useState('');
  const [surname, setSurname] = React.useState('');
  const [captchaToken, setCaptchaToken] = React.useState('');
  const [honeypot, setHoneypot] = React.useState('');
  const { onError } = useNotification();
  const permissions = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (permissions.isAuth) {
      navigate(``);
    }
  }, [navigate, permissions.isAuth]);

  /**
   * Display error notifications if some values are incorrect.
   * Return true if all values are valid, else false.
   */
  const checkIfValuesAreValid = () => {
    const errors = [];
    if (password !== passwordConfirmation) {
      errors.push(formatMessage({ id: 'The passwords must match.' }));
    }
    if (!isPasswordValid(password)) {
      errors.push(formatMessage({ id: 'password.rules.error' }));
    }
    if (!isValidEmail(email)) {
      errors.push(formatMessage({ id: 'The email must be valid.' }));
    }

    if (errors.length > 0) {
      errors.map(e => onError(e));
      return false;
    }
    return true;
  };

  const onSignUp = event => {
    event.preventDefault();
    if (checkIfValuesAreValid()) {
      dispatch(
        postSignUp({
          email,
          language: localeToLanguageId(locale),
          name,
          nickname,
          password,
          surname,
          website: honeypot,
          ...(captchaSiteKey ? { captchaToken } : {})
        })
      );
      setSignUpRequestSent(true);
    }
  };

  useEffect(() => {
    if (
      signUpState.error === null &&
      !signUpState.isFetching &&
      signUpRequestSent
    ) {
      setSignUpRequestSucceeded(true);
    } else {
      setSignUpRequestSucceeded(false);
    }
  }, [signUpState, signUpRequestSent]);

  useEffect(() => {
    if (!signUpState.error) return;
    const { code, message } = signUpState.error;
    const toastMessage = code
      ? formatMessage({
          id: code,
          defaultMessage:
            message || formatMessage({ id: 'unexpected error' })
        })
      : message || formatMessage({ id: 'unexpected error' });
    onError(toastMessage);
    // Turnstile tokens are single-use — reset so the widget issues a fresh one.
    setCaptchaToken('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signUpState.error]);

  const isSubmitDisabled = Boolean(captchaSiteKey) && !captchaToken;

  return (
    <SignUpForm
      loading={signUpState.isFetching}
      email={email}
      name={name}
      nickname={nickname}
      password={password}
      passwordConfirmation={passwordConfirmation}
      surname={surname}
      honeypot={honeypot}
      captchaSiteKey={captchaSiteKey}
      isSubmitDisabled={isSubmitDisabled}
      onEmailChange={setEmail}
      onNameChange={setName}
      onNicknameChange={setNickname}
      onPasswordChange={setPassword}
      onPasswordConfirmationChange={setPasswordConfirmation}
      onSurnameChange={setSurname}
      onHoneypotChange={setHoneypot}
      onCaptchaTokenChange={setCaptchaToken}
      onSignUp={onSignUp}
      signUpRequestSucceeded={signUpRequestSucceeded}
    />
  );
};

SignUp.propTypes = {};

export default SignUp;
