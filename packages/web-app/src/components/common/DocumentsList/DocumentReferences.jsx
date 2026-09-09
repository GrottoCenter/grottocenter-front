import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import AppLink from '@/components/common/AppLink';
import { DocumentChildPropTypes } from '@/types/document.type';
import { buildDocumentsSearchUrl } from '@/utils/documentReferenceSearch';
import DocumentsList from './DocumentsList';

const DocumentReferences = ({
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
      />
      {totalCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: 1,
            mt: 1
          }}>
          <Typography variant="body2" color="text.secondary">
            {formatMessage(
              { id: 'Showing {visible} of {total} documents' },
              { visible: documents.length, total: totalCount }
            )}
          </Typography>
          <Button
            component={AppLink}
            to={buildDocumentsSearchUrl(searchFilter)}
            endIcon={<ArrowForwardIcon />}
            size="small">
            {formatMessage({ id: 'See all documents' })}
          </Button>
        </Box>
      )}
    </>
  );
};

DocumentReferences.propTypes = {
  documents: PropTypes.arrayOf(DocumentChildPropTypes),
  totalCount: PropTypes.number.isRequired,
  searchFilter: PropTypes.objectOf(PropTypes.string).isRequired,
  emptyMessageComponent: PropTypes.node
};

export default DocumentReferences;
