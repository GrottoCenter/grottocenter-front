import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@mui/material';
import BoolIcon from '../BoolIcon';
import { checkPasswordRules, PASSWORD_MIN_LENGTH } from '../../../conf/config';

const RuleItem = ({ satisfied, labelId, labelValues = undefined }) => {
  const { formatMessage } = useIntl();
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <BoolIcon value={satisfied} />
      <Typography
        variant="caption"
        color={satisfied ? 'success.main' : 'text.secondary'}>
        {formatMessage({ id: labelId }, labelValues)}
      </Typography>
    </Box>
  );
};

RuleItem.propTypes = {
  satisfied: PropTypes.bool.isRequired,
  labelId: PropTypes.string.isRequired,
  labelValues: PropTypes.object
};

const PasswordRules = ({ password }) => {
  if (!password) return null;

  const rules = checkPasswordRules(password);

  return (
    <Box display="flex" flexDirection="column" mb={0.5}>
      <RuleItem
        satisfied={rules.minLength}
        labelId="password.rule.minLength"
        labelValues={{ n: PASSWORD_MIN_LENGTH }}
      />
      <RuleItem satisfied={rules.hasUppercase} labelId="password.rule.uppercase" />
      <RuleItem satisfied={rules.hasLowercase} labelId="password.rule.lowercase" />
      <RuleItem satisfied={rules.hasDigit} labelId="password.rule.digit" />
      <RuleItem satisfied={rules.hasSpecial} labelId="password.rule.special" />
    </Box>
  );
};

PasswordRules.propTypes = {
  password: PropTypes.string.isRequired
};

export default PasswordRules;
