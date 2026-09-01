import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import {
  DocumentChildPropTypes,
  DocumentPropTypes
} from '@/types/document.type';
import { formatDocumentReferenceParts } from '@/utils/documentReference';

const DocumentReferenceText = ({ document, fallbackToTitle = false }) => {
  const { formatMessage } = useIntl();
  const parts = formatDocumentReferenceParts(document, {
    availableAt: formatMessage({ id: 'Available at:' }),
    online: formatMessage({ id: 'online' })
  });

  if (!parts) return fallbackToTitle ? document.title : null;

  return parts.map(part =>
    part.isItalic ? <cite key={part.text}>{part.text}</cite> : part.text
  );
};

DocumentReferenceText.propTypes = {
  document: PropTypes.oneOfType([DocumentChildPropTypes, DocumentPropTypes])
    .isRequired,
  fallbackToTitle: PropTypes.bool
};

export default DocumentReferenceText;
