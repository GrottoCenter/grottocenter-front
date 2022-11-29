import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import ErrorBoundaryInner from './ErrorBoundaryInner';

// Why we need this Wrapper ? Because, without it, the hasError value can't be changed to false when the user navigate elsewhere
// See this article https://dev.to/tylerlwsmith/error-boundary-causes-react-router-links-to-stop-working-50gb
// useEffect() is slightly different and use history.listen() instead of location.pathname in order to fix an eslint "exhaustive dependancy" warning
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const history = useHistory();

  useEffect(() => {
    history.listen(() => {
      if (hasError) {
        setHasError(false);
      }
    });
    return history;
  }, [hasError, history]);

  return (
    <ErrorBoundaryInner hasError={hasError} setHasError={setHasError}>
      {children}
    </ErrorBoundaryInner>
  );
};

ErrorBoundary.propTypes = {
  children: PropTypes.node
};

export default ErrorBoundary;
