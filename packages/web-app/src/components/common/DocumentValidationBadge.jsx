import { useIntl } from 'react-intl';
import { Chip } from '@mui/material';
import { darken } from '@mui/material/styles';

import { getDocumentValidationBadge } from '@/utils/documentValidationStatus';
import { DocumentValidationStatusPropType } from '@/types/document.type';

const DocumentValidationBadge = ({ validationStatus }) => {
  const { formatMessage } = useIntl();
  const badge = getDocumentValidationBadge(validationStatus);
  if (!badge) return null;

  return (
    <Chip
      component="span"
      data-testid="document-validation-badge"
      size="small"
      variant="outlined"
      color={badge.color}
      label={formatMessage({ id: badge.label })}
      sx={{
        // Keep the semantic outline while making small text readable on paper.
        color: theme =>
          theme.palette.mode === 'dark'
            ? theme.palette[badge.color].light
            : darken(theme.palette[badge.color].main, 0.3),
        height: 'auto',
        fontWeight: 'fontWeightRegular',
        maxWidth: '100%',
        py: 0.25,
        '& .MuiChip-label': {
          whiteSpace: 'normal',
          overflow: 'visible',
          overflowWrap: 'anywhere'
        }
      }}
    />
  );
};

DocumentValidationBadge.propTypes = {
  validationStatus: DocumentValidationStatusPropType
};

export default DocumentValidationBadge;
