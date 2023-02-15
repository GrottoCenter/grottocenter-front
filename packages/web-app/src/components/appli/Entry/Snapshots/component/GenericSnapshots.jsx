import * as React from 'react';
import PropTypes from 'prop-types';

import MultilinesTypography from '../../../../common/MultilinesTypography';
import Translate from '../../../../common/Translate';
import { HighLightsLine } from '../../../../common/Highlights';

const INFORMATION_NOT_FOUND = 'unknown';

const GenericSnapshots = ({ data, previous }) => (
  <MultilinesTypography variant="body1" component="div">
    {data.body ? (
      <HighLightsLine oldText={previous?.body} newText={data.body} />
    ) : (
      <Translate>{INFORMATION_NOT_FOUND}</Translate>
    )}
  </MultilinesTypography>
);
GenericSnapshots.propTypes = {
  data: PropTypes.shape({
    body: PropTypes.string
  }),
  previous: PropTypes.shape({
    body: PropTypes.string
  })
};
export default GenericSnapshots;
