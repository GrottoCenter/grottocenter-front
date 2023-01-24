import React from 'react';
import PropTypes from 'prop-types';
import Alert from '../../../../common/Alert';
import Translate from '../../../../common/Translate';

const Alert403 = ({ type }) => (
  <Alert
    title={
      <Translate
        id="This {type} is related to a sensitive entrance. Only administrator can see this."
        values={{
          type
        }}
        defaultMessage={`This ${type} is related to a sensitive entrance. Only administrator can see this.`}
      />
    }
    severity="warning"
  />
);

Alert403.propTypes = {
  type: PropTypes.string
};

export default Alert403;
