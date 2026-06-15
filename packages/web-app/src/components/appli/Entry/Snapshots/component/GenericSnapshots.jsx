import * as React from 'react';
import PropTypes from 'prop-types';

import MultilinesTypography from '../../../../common/MultilinesTypography';
import Translate from '../../../../common/Translate';
import { HighLightsChar } from '../../../../common/Highlights';

const INFORMATION_NOT_FOUND = 'unknown';

const GenericSnapshots = ({ data, previous }) => {
  const newText = data.body ?? data.description;
  const oldText = previous?.body ?? previous?.description;
  return (
    <MultilinesTypography variant="body1" component="div">
      {newText ? (
        <HighLightsChar oldText={oldText} newText={newText} />
      ) : (
        <Translate>{INFORMATION_NOT_FOUND}</Translate>
      )}
    </MultilinesTypography>
  );
};
GenericSnapshots.propTypes = {
  data: PropTypes.shape({
    body: PropTypes.string,
    description: PropTypes.string
  }),
  previous: PropTypes.shape({
    body: PropTypes.string,
    description: PropTypes.string
  })
};
export default GenericSnapshots;
