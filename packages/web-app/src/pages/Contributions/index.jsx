import { useEffect } from 'react';
import { Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import SearchResults from '@/components/appli/AdvancedSearch/SearchResults';
import { useUserProperties, startAdvancedSearch } from '../../hooks';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import AuthChecker from '../../components/appli/AuthChecker';
import Translate from '../../components/common/Translate';

const showContributionDate = columns => {
  const column = columns.find(e => e.field === 'dateInscription');
  column.visible = true;
};

const ContributionsPage = () => {
  const userId = useUserProperties()?.id;
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (!userId) return;
    startAdvancedSearch({
      entity: 'documents',
      filter: { creatorId: userId }
    });
  }, [userId]);

  return (
    <Layout
      title={formatMessage({ id: 'My contributions' })}
      content={
        <AuthChecker
          componentToDisplay={
            <>
              <Typography variant="h3" component="h2" gutterBottom>
                <Translate>Documents</Translate>
              </Typography>
              <SearchResults
                entityType="documents"
                entityColumnsModifier={showContributionDate}
                hideExport
              />
            </>
          }
        />
      }
    />
  );
};

export default ContributionsPage;
