import { useIntl } from 'react-intl';
import { Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { getDocumentValidationBadge } from '@/utils/documentValidationStatus';
import { DocumentValidationStatusPropType } from '@/types/document.type';

const DocumentValidationBadge = ({ validationStatus }) => {
  const { formatMessage } = useIntl();
  const badge = getDocumentValidationBadge(validationStatus);
  if (!badge) return null;
  const StatusIcon =
    validationStatus === 'rejected' ? CloseIcon : HourglassEmptyIcon;

  return (
    <Chip
      component="span"
      data-testid="document-validation-badge"
      size="small"
      variant="outlined"
      color={badge.color}
      icon={<StatusIcon />}
      label={formatMessage({ id: badge.label })}
      sx={{
        borderColor: 'currentColor',
        '& .MuiChip-icon': { alignSelf: 'center' },
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
