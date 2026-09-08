import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { Box, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import AppLink from '@/components/common/AppLink';
import { DocumentChildPropTypes } from '@/types/document.type';
import { buildDocumentsSearchUrl } from '@/utils/documentReferenceSearch';
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

const OrganizationDocumentReferences = ({
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

export default OrganizationDocumentReferences;
