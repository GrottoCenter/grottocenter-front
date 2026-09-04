import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import {
  DocumentChildPropTypes,
  DocumentPropTypes
} from '@/types/document.type';
import { formatDocumentReferenceParts } from '@/utils/documentReference';

const DocumentReferenceText = ({ document }) => {
  const { formatMessage } = useIntl();
  const parts = formatDocumentReferenceParts(document, {
    availableAt: formatMessage({ id: 'Available at:' }),
    online: formatMessage({ id: 'online' })
  });

  if (!parts) return null;

  const occurrences = new Map();
  return parts.map(part => {
    const occurrence = occurrences.get(part.text) ?? 0;
    occurrences.set(part.text, occurrence + 1);
    return part.isItalic ? (
      <cite key={`${part.text}-${occurrence}`}>{part.text}</cite>
    ) : (
      part.text
    );
  });
};

DocumentReferenceText.propTypes = {
  document: PropTypes.oneOfType([DocumentChildPropTypes, DocumentPropTypes])
    .isRequired
};

export default DocumentReferenceText;
