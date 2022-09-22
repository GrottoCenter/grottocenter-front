import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { swaggerUrl } from '../../conf/apiRoutes';
import Alert from '../common/Alert';

const ApiDetail = ({ version }) => {
  const { formatMessage } = useIntl();
  if (version === 1) {
    return <SwaggerUI url={swaggerUrl} />;
  }
  return (
    <Alert
      severity="error"
      title={formatMessage(
        {
          id: 'There is no api documentation for version {apiVersion}.',
          defaultMessage:
            'There is no api documentation for version {apiVersion}.'
        },
        {
          apiVersion: version
        }
      )}
    />
  );
};

ApiDetail.propTypes = {
  version: PropTypes.number.isRequired
};

export default ApiDetail;
