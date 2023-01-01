import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import PageLoader from '../components/common/PageLoader';

const ApiDetail = React.lazy(() => import('../components/appli/ApiDetail'));

const ApiDoc = props => {
  const {
    match: {
      params: { version }
    }
  } = props;

  return (
    <Suspense fallback={<PageLoader />}>
      <ApiDetail version={Number.parseInt(version, 10)} />
    </Suspense>
  );
};

ApiDoc.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      version: PropTypes.string
    })
  }).isRequired
};

export default ApiDoc;
