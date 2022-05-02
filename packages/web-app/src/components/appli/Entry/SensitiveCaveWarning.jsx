import React from 'react';
import { useIntl } from 'react-intl';
import Alert from '../../common/Alert';

const SensitiveCaveWarning = () => {
  const { formatMessage } = useIntl();
  return (
    <Alert
      disableMargins
      severity="warning"
      title={formatMessage({
        id: 'Restricted access entrance'
      })}
      content={formatMessage({
        id:
          'This entrance requires special protection measures. We do not communicate its precise location on Grottocenter.'
      })}
    />
  );
};

export default SensitiveCaveWarning;
