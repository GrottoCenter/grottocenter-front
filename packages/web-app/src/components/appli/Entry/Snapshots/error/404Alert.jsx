import React from 'react';
import PropTypes from 'prop-types';
import Alert from '../../../../common/Alert';
import Translate from '../../../../common/Translate';

const Alert404 = ({ type }) => (
  <Alert
    title={
      <Translate
        id="This is the only version of this {type}."
        values={{
          type
        }}
        defaultMessage={`This is the only version of this ${type}.`}
      />
    }
    severity="info"
  />
);
Alert404.propTypes = {
  type: PropTypes.string
};
export default Alert404;
