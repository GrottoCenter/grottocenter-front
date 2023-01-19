import * as React from 'react';
import PropTypes from 'prop-types';

import MultilinesTypography from '../../../common/MultilinesTypography';
import Translate from '../../../common/Translate';

const INFORMATION_NOT_FOUND = 'unknown';

const GenericSnapshot = information => {
  const { data } = information;
  return (
    <MultilinesTypography variant="body1" component="div">
      <Translate>{data.body ?? INFORMATION_NOT_FOUND}</Translate>
    </MultilinesTypography>
  );
};

GenericSnapshot.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  information: PropTypes.node
};
export default GenericSnapshot;
