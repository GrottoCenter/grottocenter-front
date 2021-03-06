import React from 'react';
import PropTypes from 'prop-types';
import ApiDetail from '../components/appli/ApiDetail';

const Swagger = props => {
  const {
    match: {
      params: { version }
    }
  } = props;
  return <ApiDetail version={Number.parseInt(version, 10)} />;
};

Swagger.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      version: PropTypes.string
    })
  }).isRequired
};

export default Swagger;
