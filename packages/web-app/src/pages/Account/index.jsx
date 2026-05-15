import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Switch,
  Tooltip,
  Typography
} from '@mui/material';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TuneIcon from '@mui/icons-material/Tune';
import { styled } from '@mui/material/styles';

import { fetchAccount } from '../../actions/Account/GetAccount';
import { updateAccount } from '../../actions/Account/UpdateAccount';
import { fetchPerson } from '../../actions/Person/GetPerson';
import { joinOrganization } from '../../actions/Organization/JoinOrganization';
import { leaveOrganization } from '../../actions/Organization/LeaveOrganization';
import Alert from '../../components/common/Alert';
import BoolIcon from '../../components/common/Form/BoolIcon';

import DocumentsList from '../../components/common/DocumentsList/DocumentsList';
import EntitiesList from '../../components/common/entitiesList/EntitiesList';
import PageHeader from '../../components/common/Layouts/PageHeader';
import PageTabs from '../../components/common/Layouts/PageTabs';
import ScrollableContent from '../../components/common/Layouts/Fixed/ScrollableContent';
import RelatedCaves from '../../components/common/RelatedCaves/RelatedCaves';
import StandardDialog from '../../components/common/StandardDialog';
import InputText from '../../components/appli/EntitiesForm/utils/InputText';
import InputPassword from '../../components/appli/EntitiesForm/utils/InputPassword';
import { FormRow } from '../../components/appli/EntitiesForm/utils/FormContainers';
import PasswordRules from '../../components/common/Form/PasswordRules';
import SearchOrganizationForm from '../../components/appli/Form/SearchOrganizationForm';
import Translate from '../../components/common/Translate';
import { useUserProperties } from '../../hooks';
import useOpenLink from '../../hooks/useOpenLink';
import { AVAILABLE_LANGUAGES, isPasswordValid } from '../../conf/config';
import {
  languageIdToLocale,
  localeToLanguageId
} from '../../utils/languageMapping';

// ─── Shared styled components ─────────────────────────────────────────────────

const SectionPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  overflow: 'hidden'
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3)
}));

const SectionHeaderTitle = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8
}));

const SectionBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3)
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': { borderBottom: 'none' }
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  minWidth: 160,
  [theme.breakpoints.down('sm')]: { minWidth: 100 },
  color: theme.palette.text.secondary,
  flexShrink: 0
}));

const EditFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(3)
}));

// ─── Generic section shell ────────────────────────────────────────────────────

const SettingSection = ({
  icon,
  title,
  isEditing,
  onEdit,
  viewContent,
  editContent
}) => {
  const { formatMessage } = useIntl();
  return (
    <SectionPaper elevation={2}>
      <SectionHeader>
        <SectionHeaderTitle>
          {icon}
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </SectionHeaderTitle>
        {!isEditing && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon fontSize="small" />}
            onClick={onEdit}>
            {formatMessage({ id: 'Edit' })}
          </Button>
        )}
      </SectionHeader>
      <Divider />
      <SectionBody>{isEditing ? editContent : viewContent}</SectionBody>
    </SectionPaper>
  );
};

SettingSection.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  viewContent: PropTypes.node.isRequired,
  editContent: PropTypes.node.isRequired
};

// ─── Save/cancel footer used in edit forms ────────────────────────────────────

const BoolValue = ({ value }) => <BoolIcon value={value} sx={{ ml: 1 }} />;

BoolValue.propTypes = {
  value: PropTypes.bool.isRequired
};

const EditActions = ({ isLoading, isDisabled = false, onCancel }) => (
  <EditFooter>
    <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
      <Translate>Cancel</Translate>
    </Button>
    <Button
      type="submit"
      variant="contained"
      color="primary"
      disabled={isLoading || isDisabled}
      startIcon={
        isLoading ? <CircularProgress size={16} color="inherit" /> : null
      }>
      <Translate>Save changes</Translate>
    </Button>
  </EditFooter>
);

EditActions.propTypes = {
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired
};

// ─── Personal info section ────────────────────────────────────────────────────

const PersonalInfoSection = ({ account, onSaved }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const openLink = useOpenLink();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { nickname: '', name: '', surname: '' }
  });

  useEffect(() => {
    if (account) {
      reset({
        nickname: account.nickname ?? '',
        name: account.name ?? '',
        surname: account.surname ?? ''
      });
    }
  }, [account, reset]);

  const handleEdit = () => {
    setSaveError(null);
    setIsEditing(true);
  };
  const handleCancel = () => {
    if (account)
      reset({
        nickname: account.nickname ?? '',
        name: account.name ?? '',
        surname: account.surname ?? ''
      });
    setIsEditing(false);
    setSaveError(null);
  };

  const onSubmit = async data => {
    setIsLoading(true);
    setSaveError(null);
    try {
      await dispatch(
        updateAccount({
          nickname: data.nickname,
          name: data.name,
          surname: data.surname
        })
      );
      setIsEditing(false);
      onSaved();
    } catch {
      setSaveError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const viewContent = (
    <>
      <InfoRow>
        <InfoLabel variant="body2">{formatMessage({ id: 'Id' })}</InfoLabel>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography variant="body1">{account?.id ?? '—'}</Typography>
          {account?.id && (
            <Button
              size="small"
              variant="outlined"
              endIcon={<OpenInNewIcon fontSize="small" />}
              onClick={() => openLink(`/ui/persons/${account.id}`)}>
              {formatMessage({ id: 'My public page' })}
            </Button>
          )}
        </Box>
      </InfoRow>
      <InfoRow>
        <InfoLabel variant="body2">
          {formatMessage({ id: 'Nickname' })}
        </InfoLabel>
        <Typography variant="body1">{account?.nickname || '—'}</Typography>
      </InfoRow>
      <InfoRow>
        <InfoLabel variant="body2">
          {formatMessage({ id: 'First name' })}
        </InfoLabel>
        <Typography variant="body1">{account?.name || '—'}</Typography>
      </InfoRow>
      <InfoRow>
        <InfoLabel variant="body2">
          {formatMessage({ id: 'Last name' })}
        </InfoLabel>
        <Typography variant="body1">{account?.surname || '—'}</Typography>
      </InfoRow>
    </>
  );

  const editContent = (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <Typography variant="caption" color="text.secondary">
        <Translate>The nickname defines how other users see you.</Translate>
      </Typography>
      <FormRow>
        <InputText
          formKey="nickname"
          labelName="Nickname"
          control={control}
          isRequired
          isError={!!errors.nickname}
        />
      </FormRow>
      <FormRow>
        <InputText
          formKey="name"
          labelName="First name"
          control={control}
          isError={!!errors.name}
        />
        <InputText
          formKey="surname"
          labelName="Last name"
          control={control}
          isError={!!errors.surname}
        />
      </FormRow>
      {saveError && (
        <Alert
          severity="error"
          content={formatMessage({
            id: 'An error occurred. Please try again.'
          })}
        />
      )}
      <EditActions isLoading={isLoading} onCancel={handleCancel} />
    </form>
  );

  return (
    <SettingSection
      icon={<PersonOutlinedIcon color="action" />}
      title={formatMessage({ id: 'Personal information' })}
      isEditing={isEditing}
      onEdit={handleEdit}
      viewContent={viewContent}
      editContent={editContent}
    />
  );
};

const accountShape = PropTypes.shape({
  id: PropTypes.number,
  nickname: PropTypes.string,
  name: PropTypes.string,
  surname: PropTypes.string,
  mail: PropTypes.string,
  mailIsValid: PropTypes.bool,
  language: PropTypes.string,
  sendNotificationByEmail: PropTypes.bool
});

PersonalInfoSection.propTypes = {
  account: accountShape.isRequired,
  onSaved: PropTypes.func.isRequired
};

// ─── Email & security section ─────────────────────────────────────────────────

const EmailSecuritySection = ({ account, onSaved }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    reset: resetEmail,
    formState: { errors: emailErrors }
  } = useForm({ defaultValues: { email: '' } });
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    getValues: getPasswordValues,
    formState: { errors: passwordErrors, isValid: isPasswordFormValid }
  } = useForm({
    defaultValues: {
      currentPassword: '',
      password: '',
      passwordConfirmation: ''
    },
    mode: 'onChange'
  });

  const watchedPassword = useWatch({
    control: passwordControl,
    name: 'password'
  });

  useEffect(() => {
    if (account) resetEmail({ email: account.mail ?? '' });
  }, [account, resetEmail]);

  const handleEditEmail = () => {
    setEmailError(null);
    setIsEditingEmail(true);
  };
  const handleCancelEmail = () => {
    if (account) resetEmail({ email: account.mail ?? '' });
    setIsEditingEmail(false);
    setEmailError(null);
  };

  const onEmailSubmit = async data => {
    setIsEmailLoading(true);
    setEmailError(null);
    try {
      await dispatch(updateAccount({ email: data.email }));
      setIsEditingEmail(false);
      onSaved();
    } catch {
      setEmailError(true);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleCancelPassword = () => {
    resetPassword({
      currentPassword: '',
      password: '',
      passwordConfirmation: ''
    });
    setIsChangingPassword(false);
    setPasswordError(null);
  };

  const resolvePasswordError = error => {
    if (error?.status === 403)
      return formatMessage({ id: 'Current password is incorrect.' });
    if (error?.status === 400 && error?.body?.message)
      return error.body.message;
    return formatMessage({ id: 'An error occurred. Please try again.' });
  };

  const onPasswordSubmit = async data => {
    setIsPasswordLoading(true);
    setPasswordError(null);
    try {
      await dispatch(
        updateAccount({
          currentPassword: data.currentPassword,
          password: data.password
        })
      );
      setIsChangingPassword(false);
      resetPassword({
        currentPassword: '',
        password: '',
        passwordConfirmation: ''
      });
    } catch (error) {
      setPasswordError(resolvePasswordError(error));
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const emailViewContent = (
    <InfoRow>
      <InfoLabel variant="body2">{formatMessage({ id: 'Email' })}</InfoLabel>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap'
        }}>
        <Typography variant="body1">{account?.mail || '—'}</Typography>
        {account &&
          (account.mailIsValid ? (
            <Chip
              size="small"
              variant="outlined"
              color="success"
              icon={<CheckCircleOutlineIcon />}
              label={formatMessage({ id: 'Email verified' })}
            />
          ) : (
            <Chip
              size="small"
              variant="outlined"
              color="error"
              icon={<ErrorOutlineIcon />}
              label={formatMessage({ id: 'Email not verified' })}
            />
          ))}
      </Box>
    </InfoRow>
  );

  const emailEditContent = (
    <form onSubmit={handleEmailSubmit(onEmailSubmit)} autoComplete="off">
      <FormRow>
        <InputText
          formKey="email"
          labelName="Email"
          control={emailControl}
          isRequired
          isError={!!emailErrors.email}
          type="email"
        />
      </FormRow>
      {emailError && (
        <Alert
          severity="error"
          content={formatMessage({
            id: 'An error occurred. Please try again.'
          })}
        />
      )}
      <EditActions isLoading={isEmailLoading} onCancel={handleCancelEmail} />
    </form>
  );

  return (
    <SectionPaper elevation={2}>
      <SectionHeader>
        <SectionHeaderTitle>
          <LockOutlinedIcon color="action" />
          <Typography variant="h6" fontWeight={600}>
            <Translate>Email & Security</Translate>
          </Typography>
        </SectionHeaderTitle>
        {!isEditingEmail && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon fontSize="small" />}
            onClick={handleEditEmail}>
            {formatMessage({ id: 'Edit' })}
          </Button>
        )}
      </SectionHeader>
      <Divider />
      <SectionBody>
        {isEditingEmail ? emailEditContent : emailViewContent}

        {/* Password row */}
        <InfoRow sx={{ borderBottom: 'none' }}>
          <InfoLabel variant="body2">
            {formatMessage({ id: 'Password' })}
          </InfoLabel>
          {!isChangingPassword ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ letterSpacing: 3 }}>
                ••••••••
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setIsChangingPassword(true)}>
                <Translate>Change password</Translate>
              </Button>
            </Box>
          ) : null}
        </InfoRow>
        <Collapse in={isChangingPassword} unmountOnExit>
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            autoComplete="new-password">
            <FormRow>
              <InputPassword
                formKey="currentPassword"
                labelName="Current password"
                isPasswordVisible={isPasswordVisible}
                onShowPassword={() => setIsPasswordVisible(v => !v)}
                control={passwordControl}
                isError={!!passwordErrors.currentPassword}
                isRequired
                helperText={passwordErrors.currentPassword?.message}
              />
            </FormRow>
            <FormRow>
              <InputPassword
                formKey="password"
                labelName="New password"
                isPasswordVisible={isPasswordVisible}
                onShowPassword={() => setIsPasswordVisible(v => !v)}
                control={passwordControl}
                isError={!!passwordErrors.password}
                isRequired
                validatorFn={(value, msg) => {
                  if (!isPasswordValid(value ?? ''))
                    return msg({ id: 'password.rules.error' });
                  return true;
                }}
                helperText={passwordErrors.password?.message}
              />
              <InputPassword
                formKey="passwordConfirmation"
                labelName="Password confirmation"
                isPasswordVisible={isPasswordVisible}
                onShowPassword={() => setIsPasswordVisible(v => !v)}
                control={passwordControl}
                isError={!!passwordErrors.passwordConfirmation}
                isRequired
                validatorFn={(value, msg) => {
                  if (value !== getPasswordValues().password)
                    return msg({ id: 'The passwords do not match' });
                  return true;
                }}
                helperText={passwordErrors.passwordConfirmation?.message}
              />
            </FormRow>
            <PasswordRules password={watchedPassword ?? ''} />
            {passwordError && (
              <Alert severity="error" content={passwordError} />
            )}
            <EditActions
              isLoading={isPasswordLoading}
              isDisabled={!isPasswordFormValid}
              onCancel={handleCancelPassword}
            />
          </form>
        </Collapse>
      </SectionBody>
    </SectionPaper>
  );
};

EmailSecuritySection.propTypes = {
  account: accountShape.isRequired,
  onSaved: PropTypes.func.isRequired
};

// ─── Preferences section ──────────────────────────────────────────────────────

const PreferencesSection = ({ account, onSaved }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const currentLocale = languageIdToLocale(account?.language) ?? '';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      language: currentLocale,
      sendNotificationByEmail: account?.sendNotificationByEmail ?? false
    }
  });

  useEffect(() => {
    if (account) {
      reset({
        language: languageIdToLocale(account.language) ?? '',
        sendNotificationByEmail: account.sendNotificationByEmail ?? false
      });
    }
  }, [account, reset]);

  const handleEdit = () => {
    setSaveError(null);
    setIsEditing(true);
  };
  const handleCancel = () => {
    if (account)
      reset({
        language: languageIdToLocale(account.language) ?? '',
        sendNotificationByEmail: account.sendNotificationByEmail ?? false
      });
    setIsEditing(false);
    setSaveError(null);
  };

  const onSubmit = async data => {
    setIsLoading(true);
    setSaveError(null);
    try {
      await dispatch(
        updateAccount({
          language: localeToLanguageId(data.language),
          sendNotificationByEmail: data.sendNotificationByEmail
        })
      );
      setIsEditing(false);
      onSaved();
    } catch {
      setSaveError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const nativeName =
    AVAILABLE_LANGUAGES[languageIdToLocale(account?.language)]?.nativeName ??
    '—';

  const viewContent = (
    <>
      <InfoRow>
        <InfoLabel variant="body2">
          {formatMessage({ id: 'Language' })}
        </InfoLabel>
        <Typography variant="body1">{nativeName}</Typography>
      </InfoRow>
      <InfoRow>
        <InfoLabel variant="body2">
          {formatMessage({ id: 'Receive notifications by email' })}
        </InfoLabel>
        <BoolValue value={account?.sendNotificationByEmail ?? false} />
      </InfoRow>
    </>
  );

  const editContent = (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormRow>
        <Controller
          name="language"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControl variant="standard" fullWidth error={!!errors.language}>
              <InputLabel shrink>
                <Translate>Language</Translate>
              </InputLabel>
              <Select {...field}>
                {Object.entries(AVAILABLE_LANGUAGES).map(
                  ([locale, { nativeName: name }]) => (
                    <MenuItem key={locale} value={locale}>
                      {name}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          )}
        />
      </FormRow>
      <Box sx={{ mt: 2 }}>
        <Controller
          name="sendNotificationByEmail"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={value}
                  onChange={e => onChange(e.target.checked)}
                  color="primary"
                />
              }
              label={<Translate>Receive notifications by email</Translate>}
            />
          )}
        />
      </Box>
      {saveError && (
        <Alert
          severity="error"
          content={formatMessage({
            id: 'An error occurred. Please try again.'
          })}
        />
      )}
      <EditActions isLoading={isLoading} onCancel={handleCancel} />
    </form>
  );

  return (
    <SettingSection
      icon={<TuneIcon color="action" />}
      title={formatMessage({ id: 'Preferences' })}
      isEditing={isEditing}
      onEdit={handleEdit}
      viewContent={viewContent}
      editContent={editContent}
    />
  );
};

PreferencesSection.propTypes = {
  account: accountShape.isRequired,
  onSaved: PropTypes.func.isRequired
};

// ─── Main page ────────────────────────────────────────────────────────────────

const AccountPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const userProperties = useUserProperties();
  const userId = userProperties?.id ?? null;

  const {
    account,
    isLoading: isAccountLoading,
    error: accountError
  } = useSelector(state => state.account);
  const { person, isFetching: isPersonFetching } = useSelector(
    state => state.person
  );

  const [isOrgSearchVisible, setIsOrgSearchVisible] = useState(false);
  const [isCaveSearchVisible, setIsCaveSearchVisible] = useState(false);
  const [pendingLeaveOrg, setPendingLeaveOrg] = useState(null);

  useEffect(() => {
    dispatch(fetchAccount());
    if (userId) dispatch(fetchPerson(userId));
  }, [dispatch, userId]);

  const handleSaved = useCallback(() => {}, []);

  const handleRefreshPerson = useCallback(() => {
    if (userId) dispatch(fetchPerson(userId));
  }, [dispatch, userId]);

  const handleJoinOrganization = useCallback(
    async organizations => {
      if (!userId || organizations.length === 0) return;
      try {
        await Promise.all(
          organizations.map(org => dispatch(joinOrganization(userId, org.id)))
        );
        dispatch(fetchPerson(userId));
        setIsOrgSearchVisible(false);
      } catch {
        // join failed — leave the search form open so the user can retry
      }
    },
    [dispatch, userId]
  );

  const requestLeaveOrganization = useCallback(
    organizationId => {
      const org = (person?.organizations ?? []).find(
        o => o.id === organizationId
      );
      setPendingLeaveOrg({ id: organizationId, label: org?.name });
    },
    [person?.organizations]
  );

  const handleConfirmLeaveOrg = useCallback(async () => {
    if (!pendingLeaveOrg || !userId) return;
    const { id } = pendingLeaveOrg;
    try {
      await dispatch(leaveOrganization(userId, id));
      setPendingLeaveOrg(null);
      dispatch(fetchPerson(userId));
    } catch {
      setPendingLeaveOrg(null);
    }
  }, [dispatch, userId, pendingLeaveOrg]);

  const nbOrganizations = (person?.organizations ?? []).length;
  const nbNetworks = (person?.exploredNetworks ?? []).length;
  const nbEntrances = (person?.exploredEntrances ?? []).length;

  const tabs = [
    {
      id: 'account',
      label: formatMessage({ id: 'Profile' }),
      icon: <AccountCircleOutlinedIcon fontSize="small" />
    },
    {
      id: 'activities',
      label: formatMessage({ id: 'Activities' }),
      icon: <TravelExploreOutlinedIcon fontSize="small" />,
      count: nbOrganizations + nbNetworks + nbEntrances
    },
    {
      id: 'documents',
      label: formatMessage({ id: 'Documents' }),
      icon: <PermMediaOutlinedIcon fontSize="small" />,
      count: person?.documents?.length,
      disabled: !!person && (person.documents?.length ?? 0) === 0
    }
  ];

  const settingsContent = (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {isAccountLoading && (
        <>
          <Skeleton
            variant="rectangular"
            height={130}
            sx={{ mb: 2, borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={160}
            sx={{ mb: 2, borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={130}
            sx={{ mb: 2, borderRadius: 1 }}
          />
        </>
      )}
      {accountError && !isAccountLoading && (
        <Alert
          severity="error"
          content={formatMessage({
            id: 'An error occurred. Please try again.'
          })}
        />
      )}
      {!isAccountLoading && account && (
        <>
          <PersonalInfoSection account={account} onSaved={handleSaved} />
          <EmailSecuritySection account={account} onSaved={handleSaved} />
          <PreferencesSection account={account} onSaved={handleSaved} />
        </>
      )}
    </Box>
  );

  return (
    <>
      <PageHeader
        title={formatMessage({ id: 'My Account' })}
        icon={
          <AccountBoxIcon fontSize="inherit" sx={{ color: 'secondary.main' }} />
        }
      />
      <PageTabs tabs={tabs}>
        {/* Tab Account */}
        <div>{settingsContent}</div>

        {/* Tab Activités */}
        <div>
          {isPersonFetching ? (
            <Box sx={{ px: 2 }}>
              <Skeleton
                variant="rectangular"
                height={100}
                sx={{ mb: 2, borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={100}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          ) : (
            <>
              <ScrollableContent
                anchorId="organizations"
                title={formatMessage({ id: 'Organizations' })}
                defaultExpanded={nbOrganizations > 0}
                count={nbOrganizations}
                icon={
                  <Tooltip
                    title={formatMessage({
                      id: isOrgSearchVisible ? 'Cancel this search' : 'Join'
                    })}>
                    <Button
                      color={isOrgSearchVisible ? 'inherit' : 'secondary'}
                      variant="outlined"
                      onClick={() => setIsOrgSearchVisible(v => !v)}
                      startIcon={
                        isOrgSearchVisible ? <CancelIcon /> : <PersonAddIcon />
                      }>
                      {formatMessage({
                        id: isOrgSearchVisible ? 'Cancel' : 'Join'
                      })}
                    </Button>
                  </Tooltip>
                }
                content={
                  <>
                    {isOrgSearchVisible && (
                      <SearchOrganizationForm
                        onSubmit={handleJoinOrganization}
                      />
                    )}
                    <EntitiesList
                      type="organization"
                      entities={person?.organizations}
                      onItemRemove={requestLeaveOrganization}
                      toolTipTitle={formatMessage({ id: 'Leave organization' })}
                      emptyMessage={
                        !isOrgSearchVisible && (
                          <Alert
                            severity="info"
                            title={formatMessage({
                              id: 'This person is not a member of any organization yet.'
                            })}
                          />
                        )
                      }
                    />
                  </>
                }
              />
              <ScrollableContent
                anchorId="related-caves"
                title={formatMessage({ id: 'Explored caves' })}
                defaultExpanded={nbNetworks + nbEntrances > 0}
                count={nbNetworks + nbEntrances}
                icon={
                  <Tooltip
                    title={formatMessage({
                      id: isCaveSearchVisible
                        ? 'Cancel this search'
                        : 'Add a cave'
                    })}>
                    <Button
                      color={isCaveSearchVisible ? 'inherit' : 'secondary'}
                      variant="outlined"
                      onClick={() => setIsCaveSearchVisible(v => !v)}
                      startIcon={
                        isCaveSearchVisible ? (
                          <CancelIcon />
                        ) : (
                          <CheckCircleOutlineIcon />
                        )
                      }>
                      {formatMessage({
                        id: isCaveSearchVisible ? 'Cancel' : 'Add'
                      })}
                    </Button>
                  </Tooltip>
                }
                content={
                  <RelatedCaves
                    exploredEntrances={person?.exploredEntrances}
                    exploredNetworks={person?.exploredNetworks}
                    entityId={person?.id}
                    isOrganization={false}
                    canManageCaves
                    onRefresh={handleRefreshPerson}
                    isCaveSearchVisible={isCaveSearchVisible}
                    onToggleCaveSearch={setIsCaveSearchVisible}
                  />
                }
              />
            </>
          )}
        </div>

        {/* Tab Documents */}
        <div>
          {isPersonFetching && (
            <Card sx={{ m: 2, p: 3 }}>
              <Skeleton height={40} width="100%" />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </Card>
          )}
          {person?.id === userId && (
            <ScrollableContent
              collapsible={false}
              content={<DocumentsList documents={person.documents} />}
            />
          )}
        </div>
      </PageTabs>

      <StandardDialog
        open={!!pendingLeaveOrg}
        onClose={() => setPendingLeaveOrg(null)}
        fullWidth
        maxWidth="xs"
        title={formatMessage({ id: 'Leave organization' })}
        actions={
          <>
            <Button onClick={() => setPendingLeaveOrg(null)} variant="text">
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button onClick={handleConfirmLeaveOrg} color="error" autoFocus>
              {formatMessage({ id: 'Leave' })}
            </Button>
          </>
        }>
        {formatMessage(
          { id: 'Are you sure you want to leave {name}?' },
          {
            name: (
              <Typography component="span" fontWeight={700}>
                {pendingLeaveOrg?.label ?? '?'}
              </Typography>
            )
          }
        )}
      </StandardDialog>
    </>
  );
};

export default AccountPage;
