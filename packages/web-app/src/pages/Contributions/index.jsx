import { useEffect } from 'react';
import { Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import { fetchAdvancedSearchResults } from '../../actions/Advancedsearch';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import { useUserProperties } from '../../hooks';
import AuthChecker from '../../components/appli/AuthChecker';

import EntityTable from '../../components/common/EntityTable';
import Translate from '../../components/common/Translate';

const ContributionsPage = () => {
  const userId = useUserProperties()?.id;
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const { queryParams, isLoading, results, totalResults } = useSelector(
    state => state.advancedsearch
  );

  useEffect(() => {
    dispatch(
      fetchAdvancedSearchResults({
        entity: 'documents',
        filter: { creatorId: userId }
      })
    );
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
                isLoading={isLoading}
                pageRows={results}
                nbTotalRows={totalResults}
                onPageChange={(pageNum, pageSize) => {
                  if (!queryParams) return;
                  const newQueryParams = { ...queryParams };
                  newQueryParams.page = pageNum + 1;
                  newQueryParams.size = pageSize;
                  dispatch(fetchAdvancedSearchResults(newQueryParams, false));
                }}
                onSortChange={sort => {
                  if (!queryParams) return;
                  const newQueryParams = { ...queryParams };
                  newQueryParams.sort = sort;
                  dispatch(fetchAdvancedSearchResults(newQueryParams, false));
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
