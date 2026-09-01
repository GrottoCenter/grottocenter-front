import { useIntl } from 'react-intl';
import { Box, Typography } from '@mui/material';

import CopyToClipboardIconButton from '@/components/common/CopyToClipboardIconButton';
import DocumentReferenceText from '@/components/common/DocumentReferenceText';
import { DocumentPropTypes } from '@/types/document.type';
import { formatDocumentReference } from '@/utils/documentReference';

const BibliographicReference = ({ document }) => {
  const { formatMessage } = useIntl();
  const reference = formatDocumentReference(document, {
    availableAt: formatMessage({ id: 'Available at:' }),
    online: formatMessage({ id: 'online' })
  });

  if (!reference) return null;

  return (
    <Box component="span">
      <Typography
        component="span"
        variant="body2"
        sx={{ whiteSpace: 'pre-wrap' }}>
        <DocumentReferenceText document={document} />
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
  document: DocumentPropTypes.isRequired
};

export default BibliographicReference;
