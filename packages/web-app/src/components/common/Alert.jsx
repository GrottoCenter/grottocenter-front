import React from 'react';
import { Alert as MuiAlert, AlertTitle } from '@material-ui/lab';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledAlert = styled(MuiAlert)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const Alert = ({ title, content, severity, icon, variant, action }) => {
  return (
    <StyledAlert
      severity={severity}
      icon={icon}
      variant={variant}
      action={action}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {content}
    </StyledAlert>
  );
};

Alert.propTypes = {
  title: PropTypes.string,
  content: PropTypes.string,
  severity: PropTypes.oneOf(['error', 'success', 'info', 'warning']),
  icon: PropTypes.element,
  variant: PropTypes.oneOf(['filled', 'outlined', 'standard', 'string']),
  action: PropTypes.element
};

export default Alert;
