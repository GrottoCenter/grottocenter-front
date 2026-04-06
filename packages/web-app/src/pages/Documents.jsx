import React from 'react';
import { useIntl } from 'react-intl';
import { Typography } from '@mui/material';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import DocumentSearch from '../components/appli/AdvancedSearch/DocumentSearch';
import InternationalizedLink from '../components/common/InternationalizedLink';
import { wikiBBSLinks } from '../conf/externalLinks';

const DocumentsSearchPage = () => {
  const { formatMessage } = useIntl();
  return (
    <EntitySearchPage
      title="Documents"
      entityType="documents"
      subheader={
        <Typography variant="subtitle2" color="text.secondary">
          {formatMessage({ id: 'The BBS ("Bulletin Bibliographique Spéléologique" in french) is an annual review of the worldwide speleological literature.' })}{' '}
          <InternationalizedLink links={wikiBBSLinks}>
            {formatMessage({ id: 'You can find more info about the BBS on the dedicated Grottocenter-wiki page.' })}
          </InternationalizedLink>
        </Typography>
      }>
      <DocumentSearch />
    </EntitySearchPage>
  );
};

export default DocumentsSearchPage;
