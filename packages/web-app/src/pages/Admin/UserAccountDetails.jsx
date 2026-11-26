import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Chip, Stack, Typography } from '@mui/material';

const isDefined = value => value !== undefined && value !== null;

const StatusChip = ({ isOk, okLabel, notOkLabel }) => (
  <Chip
    size="small"
    color={isOk ? 'success' : 'warning'}
    label={isOk ? okLabel : notOkLabel}
  />
);

StatusChip.propTypes = {
  isOk: PropTypes.bool.isRequired,
  okLabel: PropTypes.string.isRequired,
  notOkLabel: PropTypes.string.isRequired
};

const Row = ({ label, children }) => (
  <Typography component="div" variant="body2" sx={{ mb: 1 }}>
    <strong>{label}</strong>
    <div>{children}</div>
  </Typography>
);

Row.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

/**
 * Admin-only account state of the selected user. The API only returns these
 * fields to administrators, so each row is rendered only when its field is
 * present.
 */
const UserAccountDetails = ({ person }) => {
  const { formatMessage, formatDate } = useIntl();

  if (!person) return null;

  const {
    mail,
    pendingMail,
    mailIsValid,
    activated,
    mfaEnabled,
    dateInscription,
    dateLastConnection,
    connectionCounter,
    loginFailedAttempts,
    lastFailedLoginAt,
    totpFailedAttempts
  } = person;

  const formatDateTime = value =>
    formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'adminUserDetails.title' })}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {isDefined(mailIsValid) && (
          <StatusChip
            isOk={Boolean(mailIsValid)}
            okLabel={formatMessage({ id: 'Email verified' })}
            notOkLabel={formatMessage({ id: 'Email not verified' })}
          />
        )}
        {isDefined(activated) && (
          <StatusChip
            isOk={Boolean(activated)}
            okLabel={formatMessage({ id: 'adminUserDetails.activated' })}
            notOkLabel={formatMessage({ id: 'adminUserDetails.notActivated' })}
          />
        )}
        {isDefined(mfaEnabled) && (
          <StatusChip
            isOk={Boolean(mfaEnabled)}
            okLabel={formatMessage({ id: 'adminUserDetails.mfaEnabled' })}
            notOkLabel={formatMessage({ id: 'adminUserDetails.mfaDisabled' })}
          />
        )}
      </Stack>
      {mail && (
        <Row label={formatMessage({ id: 'Email' })}>
          <span data-testid="admin-user-mail">{mail}</span>
        </Row>
      )}
      {pendingMail && (
        <Row label={formatMessage({ id: 'adminUserDetails.pendingMail' })}>
          <span data-testid="admin-user-pending-mail">{pendingMail}</span>
        </Row>
      )}
      {dateInscription && (
        <Row label={formatMessage({ id: 'adminUserDetails.registeredOn' })}>
          {formatDateTime(dateInscription)}
        </Row>
      )}
      {dateLastConnection !== undefined && (
        <Row label={formatMessage({ id: 'adminUserDetails.lastConnection' })}>
          {dateLastConnection === null
            ? formatMessage({ id: 'adminUserDetails.never' })
            : formatDateTime(dateLastConnection)}
        </Row>
      )}
      {isDefined(connectionCounter) && (
        <Row label={formatMessage({ id: 'adminUserDetails.connections' })}>
          {connectionCounter}
        </Row>
      )}
      {isDefined(loginFailedAttempts) && (
        <Row label={formatMessage({ id: 'adminUserDetails.failedLogins' })}>
          {loginFailedAttempts}
        </Row>
      )}
      {lastFailedLoginAt && (
        <Row label={formatMessage({ id: 'adminUserDetails.lastFailedLogin' })}>
          {formatDateTime(lastFailedLoginAt)}
        </Row>
      )}
      {isDefined(totpFailedAttempts) && (
        <Row label={formatMessage({ id: 'adminUserDetails.failedMfa' })}>
          {totpFailedAttempts}
        </Row>
      )}
    </>
  );
};

UserAccountDetails.propTypes = {
  person: PropTypes.shape({
    mail: PropTypes.string,
    pendingMail: PropTypes.string,
    mailIsValid: PropTypes.bool,
    activated: PropTypes.bool,
    mfaEnabled: PropTypes.bool,
    dateInscription: PropTypes.string,
    dateLastConnection: PropTypes.string,
    connectionCounter: PropTypes.number,
    loginFailedAttempts: PropTypes.number,
    lastFailedLoginAt: PropTypes.string,
    totpFailedAttempts: PropTypes.number
  })
};

export default UserAccountDetails;
