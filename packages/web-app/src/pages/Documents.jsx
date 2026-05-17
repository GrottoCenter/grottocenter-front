import React from 'react';
import { useIntl } from 'react-intl';
import { Typography } from '@mui/material';
import EntitySearchPage from '../components/appli/AdvancedSearch/EntitySearchPage';
import DocumentSearch from '../components/appli/AdvancedSearch/DocumentSearch';
import InternationalizedLink from '../components/common/InternationalizedLink';
import { wikiBBSLinks } from '../conf/externalLinks';
import NewEntityButton from '../components/common/NewEntityButton';
import { EntityIcon } from './EntityCreation/entityConfig';

const DocumentsSearchPage = () => {
  const { formatMessage } = useIntl();
  return (
    <EntitySearchPage
      title="Documents"
      entityType="documents"
      actions={
        <NewEntityButton
          to="/ui/entity/add/document"
          icon={<EntityIcon iconType="bibliography" size={20} />}
        />
      }
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
