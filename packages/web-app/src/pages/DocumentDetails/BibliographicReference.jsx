import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

import CopyToClipboardIconButton from '@/components/common/CopyToClipboardIconButton';

const BibliographicReference = ({ reference }) => {
  const { formatMessage } = useIntl();

  return (
    <Box component="span">
      <Typography
        component="span"
        variant="body2"
        sx={{ whiteSpace: 'pre-wrap' }}>
        {reference}
      </Typography>{' '}
      <CopyToClipboardIconButton
        compact
        value={reference}
        label={formatMessage({ id: 'Copy reference' })}
        successLabel={formatMessage({ id: 'Reference copied' })}
        errorLabel={formatMessage({ id: 'Unable to copy reference' })}
      />
    </Box>
  );
};

BibliographicReference.propTypes = {
  reference: PropTypes.string.isRequired
};

export default BibliographicReference;
