import React, { useContext, useState, useEffect } from 'react';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel
} from '@mui/material';
import Translate from '../../../../common/Translate';

import { DocumentFormContext, isDocumentPagesFormatValid } from '../Provider';

const PagesEditor = () => {
  const [isFormatError, setIsFormatError] = useState(false);
  const { document, updateAttribute } = useContext(DocumentFormContext);

  const pages = document.pages ?? '';

  useEffect(() => {
    isDocumentPagesFormatValid(pages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormControl variant="filled" error={isFormatError} fullWidth>
      <InputLabel>
        <Translate>Pages</Translate>
      </InputLabel>
      <FilledInput
        onChange={e => {
          const reg = /^(\d+-?\d*)?$/;
          const newV = e.target.value;
          if (newV.match(reg) || !pages.match(pages)) {
            updateAttribute('pages', newV);
            setIsFormatError(!isDocumentPagesFormatValid(newV));
          }
        }}
        type="text"
        value={pages}
      />

      <FormHelperText>
        <Translate>
          The page or the pages interval (using format: start-end, e.g: 10-12)
          where the article is.
        </Translate>
      </FormHelperText>
    </FormControl>
  );
};

PagesEditor.propTypes = {};

export default PagesEditor;
