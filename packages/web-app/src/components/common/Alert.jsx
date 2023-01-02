import React from 'react';
import { Alert as MuiAlert, AlertTitle } from '@mui/material';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledAlert = styled(MuiAlert)`
  margin-top: ${({ theme, $disableMargins }) =>
    !$disableMargins && theme.spacing(2)};
  margin-bottom: ${({ theme, $disableMargins }) =>
    !$disableMargins && theme.spacing(2)};
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
    $disableMargins={disableMargins}
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
