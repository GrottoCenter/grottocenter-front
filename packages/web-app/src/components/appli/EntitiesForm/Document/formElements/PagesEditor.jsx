import { useContext } from 'react';
import { useIntl } from 'react-intl';
import StringInput from '@/components/common/Form/StringInput';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import { DocumentFormContext, isDocumentPagesFormatValid } from '../Provider';

const PagesEditor = () => {
  const { formatMessage } = useIntl();
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const pages = document.pages ?? '';

  return (
    <StringInput
      helperText={formatMessage({
        id: 'Enter the page or page range where the article appears, using the page numbers printed in the document.'
      })}
      valueName={formatMessage({ id: 'Pages (e.g. 10 or 10-12)' })}
      value={pages}
      maxLength={TEXT_LENGTH_LIMITS.DOCUMENT_PAGES}
      hasError={!isDocumentPagesFormatValid(pages)}
      onValueChange={value => {
        if (/^(\d+-?\d*)?$/.test(value)) updateAttribute('pages', value);
      }}
    />
  );
};

export default PagesEditor;
