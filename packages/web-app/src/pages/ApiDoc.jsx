import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import PageLoader from '../components/common/PageLoader';

const ApiDetail = React.lazy(() => import('../components/appli/ApiDetail'));

const ApiDoc = () => {
  const { version } = useParams();

  return (
    <Suspense fallback={<PageLoader />}>
      <ApiDetail version={Number.parseInt(version ?? 1, 10)} />
    </Suspense>
  );
};

ApiDoc.propTypes = {};

export default ApiDoc;
