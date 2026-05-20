import React, { useContext, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useIntl } from 'react-intl';
import { useUserProperties } from '../../../../../hooks';
import { DocumentFormContext } from '../Provider';
import MultipleCaversSelect from './MultipleCaversSelect';

const AuthorsSection = () => {
  const { formatMessage } = useIntl();
  const { document: doc, updateAttribute } = useContext(DocumentFormContext);
  const currentUser = useUserProperties();
  const hasPrefilledRef = useRef(false);

  useEffect(() => {
    if (hasPrefilledRef.current || !currentUser.id || doc.authors.length > 0)
      return;
    hasPrefilledRef.current = true;
    updateAttribute('authors', [
      { id: currentUser.id, nickname: currentUser.nickname }
    ]);
    // doc.authors and updateAttribute are stable; currentUser.id guards async hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  return (
    <Box sx={{ mt: 2 }}>
      <MultipleCaversSelect
        computeHasError={() => false}
        contextValueName="authors"
        helperText={formatMessage({
          id: 'Choose one or more authors among those already registered. If the author you are looking for does not exist in Grottocenter, it is possible to add him/her using the + button on the right.'
        })}
        labelName="Authors"
        required
      />
    </Box>
  );
};

export default AuthorsSection;
