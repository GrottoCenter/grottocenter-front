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
  const formatChange = (field, text) => {
    if (!text) return text;
    if (field.startsWith('isPanorama-'))
      return formatMessage({ id: text === 'true' ? 'Yes' : 'No' });
    if (field === 'type') return formatMessage({ id: text });
    return text;
  };
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
        {changes.map(({ field, label, fileName, oldText, newText }) => (
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
              label={`${formatMessage({ id: label })}${fileName ? ` — ${fileName}` : ''}`}
              value={
                <HighLightsChar
                  showChangeMarkers
                  oldText={formatChange(field, oldText)}
                  newText={formatChange(field, newText)}
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
