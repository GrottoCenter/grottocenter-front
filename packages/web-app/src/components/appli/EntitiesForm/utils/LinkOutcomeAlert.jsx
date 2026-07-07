import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import Alert from '../../../common/Alert';

// Given the entrance count of the selected target, previews the outcome of
// linking: creating a 2-entrance network (target is a single entrance) or
// extending an existing network. Shared by the creation form and the move page.
const LinkOutcomeAlert = ({ targetNbEntrances, disableMargins = false }) => {
  const { formatMessage } = useIntl();
  if (targetNbEntrances === null || targetNbEntrances === undefined) {
    return null;
  }
  return (
    <Alert
      severity="info"
      disableMargins={disableMargins}
      content={
        targetNbEntrances <= 1
          ? formatMessage({
              id: 'Linking to this entrance will create a network of 2 entrances.'
            })
          : formatMessage(
              {
                id: 'Linking to this network will extend it to {count} entrances.'
              },
              { count: targetNbEntrances + 1 }
            )
      }
    />
  );
};

LinkOutcomeAlert.propTypes = {
  targetNbEntrances: PropTypes.number,
  disableMargins: PropTypes.bool
};

export default LinkOutcomeAlert;
