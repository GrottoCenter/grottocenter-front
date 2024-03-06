import React from 'react';
import { Alert as MuiAlert, AlertTitle } from '@mui/material';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

const StyledAlert = styled(MuiAlert, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  margin-top: ${({ theme, $disablemargins }) =>
    !$disablemargins && theme.spacing(2)};
  margin-bottom: ${({ theme, $disablemargins }) =>
    !$disablemargins && theme.spacing(2)};
`;

const Alert = ({
  title,
  content,
  severity,
  icon,
  variant,
  action,
  disableMargins = false
}) => (
  <StyledAlert
    $disablemargins={disableMargins ? 1 : 0}
    severity={severity}
    icon={icon}
    variant={variant}
    action={action}>
    {title && <AlertTitle style={{ fontWeight: 'bold' }}>{title}</AlertTitle>}
    {content}
  </StyledAlert>
);

Alert.propTypes = {
  disableMargins: PropTypes.bool,
  title: PropTypes.string,
  content: PropTypes.node,
  severity: PropTypes.oneOf(['error', 'success', 'info', 'warning']),
  icon: PropTypes.element,
  variant: PropTypes.oneOf(['filled', 'outlined', 'standard', 'string']),
  action: PropTypes.element
};

export default Alert;
