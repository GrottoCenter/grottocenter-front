import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { Box, Button, Collapse, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import AppLink from '@/components/common/AppLink';
import { DocumentChildPropTypes } from '@/types/document.type';
import { buildDocumentsSearchUrl } from '@/utils/documentReferenceSearch';
import { getDocumentReferenceLabel } from '@/utils/documentReference';
import {
  DOCUMENT_TYPE_FALLBACK_ICON,
  DOCUMENT_TYPE_ICONS
} from '@/utils/documentTypeHelpers';
import DocumentsList from './DocumentsList';

export const DocumentReferencesSubheader = ({ visibleCount, totalCount }) =>
  totalCount > visibleCount ? (
    <FormattedMessage
      id="Showing the latest {visible} of {total} documents"
      defaultMessage="Showing the latest {visible} of {total} documents"
      values={{ visible: visibleCount, total: totalCount }}
    />
  ) : null;

DocumentReferencesSubheader.propTypes = {
  visibleCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired
};

// This preview is used by organization and person pages. It shares this
// module with the bibliographic-reference list below, but has a different
// contract and therefore remains a named export.
export const OrganizationDocumentReferences = ({
  documents = [],
  totalCount,
  searchFilter,
  emptyMessageComponent
}) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <DocumentsList
        documents={documents}
        emptyMessageComponent={emptyMessageComponent}
        showSort={false}
      />
      {totalCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 1,
            '@media print': { display: 'none' }
          }}>
          <Button
            component={AppLink}
            to={buildDocumentsSearchUrl(searchFilter)}
            endIcon={<ArrowForwardIcon />}
            variant="outlined"
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {formatMessage({ id: 'See all documents' })}
          </Button>
        </Box>
      )}
    </>
  );
};

OrganizationDocumentReferences.propTypes = {
  documents: PropTypes.arrayOf(DocumentChildPropTypes),
  totalCount: PropTypes.number.isRequired,
  searchFilter: PropTypes.objectOf(PropTypes.string).isRequired,
  emptyMessageComponent: PropTypes.node
};

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
            <AppLink openInNewTabDesktop to={`/ui/documents/${document.id}`}>
              {getDocumentReferenceLabel(document)}
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
