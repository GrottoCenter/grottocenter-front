import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Box,
  Button,
  Collapse,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import AppLink from '@/components/common/AppLink';
import DocumentReferenceText from '@/components/common/DocumentReferenceText';
import { DocumentChildPropTypes } from '@/types/document.type';
import { formatDocumentReference } from '@/utils/documentReference';
import { buildDocumentsSearchUrl } from '@/utils/documentReferenceSearch';
import CopyToClipboardIconButton from '../CopyToClipboardIconButton';
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

const MOBILE_REFERENCE_PREVIEW_LIMIT = 5;
const REFERENCE_PREVIEW_LIMIT = 10;

const ReferenceList = ({ documents, start = 1 }) => {
  const { formatMessage } = useIntl();
  const labels = {
    availableAt: formatMessage({ id: 'Available at:' }),
    online: formatMessage({ id: 'online' })
  };

  return (
    <Box
      component="ol"
      start={start}
      sx={{ my: 0, pl: 3, display: 'grid', gap: 0.5 }}>
      {documents.map(document => {
        const reference = formatDocumentReference(document, labels);
        return (
          <Typography component="li" variant="body2" key={document.id}>
            <DocumentReferenceText document={document} />{' '}
            <CopyToClipboardIconButton
              compact
              value={reference}
              label={formatMessage({ id: 'Copy reference' })}
              successLabel={formatMessage({ id: 'Reference copied' })}
              errorLabel={formatMessage({
                id: 'Unable to copy reference'
              })}
            />
          </Typography>
        );
      })}
    </Box>
  );
};

ReferenceList.propTypes = {
  documents: PropTypes.arrayOf(DocumentChildPropTypes).isRequired,
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
  const references = documents.filter(document =>
    Boolean(formatDocumentReference(document))
  );

  if (references.length === 0) return null;

  const preview = references.slice(0, previewLimit);
  const additional = references.slice(previewLimit);

  return (
    <Box component="section" mt={2}>
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
            <ReferenceList documents={additional} start={previewLimit + 1} />
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
