import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, Collapse, Typography } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { DocumentChildPropTypes } from '@/types/document.type';
import { getDocumentReferenceLabel } from '@/utils/documentReference';
import {
  DOCUMENT_TYPE_FALLBACK_ICON,
  DOCUMENT_TYPE_ICONS
} from '@/utils/documentTypeHelpers';
import AppLink from '../AppLink';
import DocumentReferenceText from '../DocumentReferenceText';

const REFERENCE_PREVIEW_LIMIT = 10;

const ReferenceList = ({ documents, start = 1 }) => (
  <Box
    component="ol"
    start={start}
    sx={{ my: 0, pl: 3, display: 'grid', gap: 0.5 }}>
    {documents.map(document => {
      const TypeIcon =
        DOCUMENT_TYPE_ICONS[document.type] ?? DOCUMENT_TYPE_FALLBACK_ICON;
      return (
        <Typography component="li" variant="body2" key={document.id}>
          <Box
            component="span"
            sx={{ display: 'inline-flex', alignItems: 'flex-start', gap: 0.5 }}>
            <TypeIcon
              aria-hidden="true"
              fontSize="small"
              sx={{ flexShrink: 0 }}
            />
            <AppLink to={`/ui/documents/${document.id}`}>
              <DocumentReferenceText document={document} fallbackToTitle />
            </AppLink>
          </Box>
        </Typography>
      );
    })}
  </Box>
);

ReferenceList.propTypes = {
  documents: PropTypes.arrayOf(DocumentChildPropTypes).isRequired,
  start: PropTypes.number
};

const DocumentReferences = ({ documents }) => {
  const { formatMessage } = useIntl();
  const additionalReferencesId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const references = documents.filter(getDocumentReferenceLabel);

  if (references.length === 0) return null;

  const preview = references.slice(0, REFERENCE_PREVIEW_LIMIT);
  const additional = references.slice(REFERENCE_PREVIEW_LIMIT);

  return (
    <Box component="section">
      <Typography variant="h5" component="h3" mb={0.5}>
        {formatMessage({ id: 'Bibliographic references' })}
      </Typography>
      <ReferenceList documents={preview} />
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
            <ReferenceList
              documents={additional}
              start={REFERENCE_PREVIEW_LIMIT + 1}
            />
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
