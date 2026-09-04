import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Collapse,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { DocumentChildPropTypes } from '@/types/document.type';
import { formatDocumentReference } from '@/utils/documentReference';
import CopyToClipboardIconButton from '../CopyToClipboardIconButton';
import DocumentReferenceText from '../DocumentReferenceText';

const MOBILE_REFERENCE_PREVIEW_LIMIT = 5;
const REFERENCE_PREVIEW_LIMIT = 10;

const ReferenceList = ({ references, start = 1 }) => {
  const { formatMessage } = useIntl();

  return (
    <Box
      component="ol"
      start={start}
      sx={{ my: 0, pl: 3, display: 'grid', gap: 0.5 }}>
      {references.map(({ document, reference }) => (
        <Typography component="li" variant="body2" key={document.id}>
          <DocumentReferenceText document={document} />{' '}
          {reference && (
            <CopyToClipboardIconButton
              compact
              value={reference}
              label={formatMessage({ id: 'Copy reference' })}
              successLabel={formatMessage({ id: 'Reference copied' })}
              errorLabel={formatMessage({
                id: 'Unable to copy reference'
              })}
            />
          )}
        </Typography>
      ))}
    </Box>
  );
};

ReferenceList.propTypes = {
  references: PropTypes.arrayOf(
    PropTypes.shape({
      document: DocumentChildPropTypes.isRequired,
      reference: PropTypes.string.isRequired
    })
  ).isRequired,
  start: PropTypes.number
};

const DocumentReferences = ({ documents }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const additionalReferencesId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const previewLimit = isMobile
    ? MOBILE_REFERENCE_PREVIEW_LIMIT
    : REFERENCE_PREVIEW_LIMIT;
  const labels = {
    availableAt: formatMessage({ id: 'Available at:' }),
    online: formatMessage({ id: 'online' })
  };
  const references = documents
    .map(document => ({
      document,
      reference: formatDocumentReference(document, labels)
    }))
    .filter(({ reference }) => Boolean(reference));

  if (references.length === 0) return null;

  const preview = references.slice(0, previewLimit);
  const additional = references.slice(previewLimit);

  return (
    <Box component="section" mt={2}>
      <Typography variant="h5" component="h3" mb={0.5}>
        {formatMessage({ id: 'Bibliographic references' })}
      </Typography>
      <ReferenceList references={preview} />
      {additional.length > 0 && (
        <>
          <Collapse
            id={additionalReferencesId}
            in={isExpanded}
            timeout="auto"
            sx={{
              '@media print': {
                height: 'auto !important',
                visibility: 'visible !important'
              }
            }}>
            <ReferenceList references={additional} start={previewLimit + 1} />
          </Collapse>
          <Button
            size="small"
            variant="text"
            endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            aria-expanded={isExpanded}
            aria-controls={additionalReferencesId}
            sx={{
              p: 0.25,
              minWidth: 0,
              textTransform: 'none',
              '@media print': { display: 'none' }
            }}
            onClick={() => setIsExpanded(value => !value)}>
            {formatMessage({ id: isExpanded ? 'Show less' : 'Show more' })}
          </Button>
        </>
      )}
    </Box>
  );
};

DocumentReferences.propTypes = {
  documents: PropTypes.arrayOf(DocumentChildPropTypes).isRequired
};

export default DocumentReferences;
