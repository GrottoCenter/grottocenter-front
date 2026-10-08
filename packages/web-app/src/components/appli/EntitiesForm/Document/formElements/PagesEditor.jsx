import { useContext, useState, useEffect, useId } from 'react';
import {
  FilledInput,
  FormControl,
  InputLabel,
  Typography
} from '@mui/material';
import { useIntl } from 'react-intl';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import Translate from '../../../../common/Translate';

import { DocumentFormContext, isDocumentPagesFormatValid } from '../Provider';

const PagesEditor = () => {
  const inputId = useId();
  const { formatMessage } = useIntl();
  const [isFormatError, setIsFormatError] = useState(false);
  const { document, updateAttribute } = useContext(DocumentFormContext);

  const pages = document.pages ?? '';
  const isTooLong = pages.length > TEXT_LENGTH_LIMITS.DOCUMENT_PAGES;

  useEffect(() => {
    setIsFormatError(!isDocumentPagesFormatValid(pages));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          display: 'block'
        }}>
        <Translate>
          The page or the pages interval (using format: start-end, e.g: 10-12)
          where the article is.
        </Translate>
      </Typography>
      <FormControl
        variant="filled"
        error={isFormatError || isTooLong}
        fullWidth>
        <InputLabel htmlFor={inputId}>
          <Translate>Pages</Translate>
        </InputLabel>
        <FilledInput
          id={inputId}
          onChange={e => {
            const reg = /^(\d+-?\d*)?$/;
            const newV = e.target.value;
            if (newV.match(reg)) {
              updateAttribute('pages', newV);
              setIsFormatError(!isDocumentPagesFormatValid(newV));
            }
          }}
          type="text"
          value={pages}
          inputProps={{ maxLength: TEXT_LENGTH_LIMITS.DOCUMENT_PAGES }}
        />
      </FormControl>
      {(isTooLong ||
        pages.length >= Math.ceil(TEXT_LENGTH_LIMITS.DOCUMENT_PAGES * 0.8)) && (
        <Typography
          variant="caption"
          color={isTooLong ? 'error' : 'text.secondary'}>
          {formatMessage(
            { id: 'form.maxLength' },
            { count: pages.length, limit: TEXT_LENGTH_LIMITS.DOCUMENT_PAGES }
          )}
        </Typography>
      )}
    </>
  );
};

PagesEditor.propTypes = {};

export default PagesEditor;
