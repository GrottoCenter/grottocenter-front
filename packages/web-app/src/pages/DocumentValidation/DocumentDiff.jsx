import { Box, Card, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import { HighLightsChar } from '@/components/common/Highlights';
import { Property } from '@/components/common/Properties';
import { getDocumentChanges } from '@/utils/documentModeration';
import { DocumentPropTypes } from '@/types/document.type';

// History has snapshot-specific shapes and metadata. Share its text diff and
// property renderer, rather than making DocumentSnapshots handle both contracts.
const DocumentDiff = ({ current, proposed }) => {
  const { formatMessage } = useIntl();
  const changes = getDocumentChanges(current, proposed);
  return (
    <Card
      component="section"
      data-testid="document-diff"
      sx={{ my: 1, p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        {formatMessage({ id: 'documentModeration.changes' })}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {formatMessage({ id: 'documentModeration.legend' })}
      </Typography>
      {changes.length === 0 && (
        <Typography variant="body2">
          {formatMessage({ id: 'documentModeration.noChanges' })}
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))'
          },
          gap: 1,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere'
        }}>
        {changes.map(({ field, label, oldText, newText }) => (
          <Box
            key={field}
            data-testid={`document-diff-${field}`}
            sx={{
              minWidth: 0,
              gridColumn:
                field === 'title' || field === 'description' ? '1 / -1' : 'auto'
            }}>
            <Property
              flexBasis="100%"
              label={formatMessage({ id: label })}
              value={
                <HighLightsChar
                  showChangeMarkers
                  oldText={
                    field === 'type' && oldText
                      ? formatMessage({ id: oldText })
                      : oldText
                  }
                  newText={
                    field === 'type' && newText
                      ? formatMessage({ id: newText })
                      : newText
                  }
                />
              }
            />
          </Box>
        ))}
      </Box>
    </Card>
  );
};

DocumentDiff.propTypes = {
  current: DocumentPropTypes.isRequired,
  proposed: DocumentPropTypes.isRequired
};

export default DocumentDiff;
