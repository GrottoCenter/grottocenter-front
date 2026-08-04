import React from 'react';
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
    />
  );
};

DocumentTypeChip.propTypes = {
  type: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium'])
};

export default DocumentTypeChip;
