import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Chip } from '@mui/material';

import {
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_FALLBACK_ICON
} from '../../utils/documentTypeHelpers';

const DocumentTypeChip = ({ type, size = 'small' }) => {
  const { formatMessage } = useIntl();
  const IconComponent =
    (type && DOCUMENT_TYPE_ICONS[type]) || DOCUMENT_TYPE_FALLBACK_ICON;
  const label = type
    ? formatMessage({ id: type })
    : formatMessage({ id: 'unknown' });
  return (
    <Chip
      variant="outlined"
      color="primary"
      size={size}
      icon={<IconComponent />}
      label={label}
      sx={{
        // Type labels are long ("Topographic drawing", "Interactive resource")
        // and the chip is rendered in half-width property cells: MUI's default
        // nowrap label would either spill out of the cell or be ellipsized down
        // to an unreadable stub. Wrap onto a second line instead — no effect
        // wherever the chip already has the room.
        height: 'auto',
        py: 0.25,
        '& .MuiChip-label': { whiteSpace: 'normal', overflow: 'visible' }
      }}
    />
  );
};

DocumentTypeChip.propTypes = {
  type: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium'])
};

export default DocumentTypeChip;
