import * as React from 'react';

import MultilinesTypography from '../../../common/MultilinesTypography';
import Translate from '../../../common/Translate';

const GenericSnapshot = data => {
  const information = data.data;
  return (
    <MultilinesTypography variant="body1" component="div">
      <Translate>{information.body}</Translate>
    </MultilinesTypography>
  );
};

export default GenericSnapshot;
