import { useEffect } from 'react';
import { Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import {
  useUserProperties,
  useAdvancedSearch,
  startAdvancedSearch,
  refineAdvancedSearch
} from '../../hooks';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import AuthChecker from '../../components/appli/AuthChecker';
import EntityTable from '../../components/common/EntityTable';
import Translate from '../../components/common/Translate';

const ContributionsPage = () => {
  const userId = useUserProperties()?.id;
  const { formatMessage } = useIntl();
  const { data, isFetching, params } = useAdvancedSearch();
  const results = data?.results;
  const totalResults = data?.totalResults ?? 0;

  useEffect(() => {
    startAdvancedSearch({
      entity: 'documents',
      filter: { creatorId: userId }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <EntityTable
                entityType="documents"
                entityColumnsModifier={columns => {
                  const c = columns.find(e => e.field === 'dateInscription');
                  c.visible = true;
                }}
                isLoading={isFetching}
                pageRows={results}
                nbTotalRows={totalResults}
                onPageChange={(pageNum, pageSize) => {
                  if (!params) return;
                  refineAdvancedSearch({
                    ...params,
                    page: pageNum + 1,
                    size: pageSize
                  });
                }}
                onSortChange={sort => {
                  if (!params) return;
                  refineAdvancedSearch({ ...params, sort });
                }}
              />
            </>
          }
        />
      }
    />
  );
};

export default ContributionsPage;
