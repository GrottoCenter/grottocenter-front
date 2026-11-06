import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import AppLink from '@/components/common/AppLink';
import EntityTable from '@/components/common/EntityTable';
import { getStoredRowsPerPage } from '@/components/common/EntityTable/tableUtils';
import FetchErrorState from '@/components/common/FetchErrorState';
import { useAssociatedPoints, useOnlineStatus } from '@/hooks';
import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import Alert from '../../common/Alert';
import NewEntityButton from '../../common/NewEntityButton';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const ScienceSection = ({
  caveId,
  entranceId = null,
  networkId = null,
  networkName = null,
  isNetworkEntrance = false
}) => {
  const { formatMessage } = useIntl();
  const [searchParams] = useSearchParams();
  const isOnline = useOnlineStatus();
  const [pagination, setPagination] = useState(() => ({
    page: 1,
    size: getStoredRowsPerPage(PAGE_SIZE_OPTIONS)
  }));
  const { data, error, isFetching, isPaused, refetch } = useAssociatedPoints({
    entranceId,
    networkId,
    legacyCaveId: caveId,
    ...pagination,
    enabled: searchParams.get('tab') === 'science'
  });

  return (
    <>
      <Box data-testid="science-points">
        <ScrollableContent
          dense
          collapsible={false}
          anchorId="points"
          title={formatMessage({
            id: isNetworkEntrance ? 'points.networkPoints' : 'Points'
          })}
          count={data?.total}
          subheader={
            isNetworkEntrance ? (
              <AppLink to={`/ui/caves/${networkId}`}>
                {networkName ?? String(networkId)}
              </AppLink>
            ) : undefined
          }
          content={
            <>
              {(error || isPaused) && (
                <FetchErrorState
                  error={error}
                  isPaused={isPaused}
                  messageId="points.fetchError"
                  onRetry={refetch}
                />
              )}
              {(!error && !isPaused) || data ? (
                <EntityTable
                  entityType="associatedPoints"
                  pageRows={data?.points ?? []}
                  nbTotalRows={data?.total}
                  isLoading={isFetching}
                  isOffline={!isOnline}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageChange={(page, size) =>
                    setPagination({ page: page + 1, size })
                  }
                />
              ) : null}
            </>
          }
        />
      </Box>
      <ScrollableContent
        dense
        anchorId="science"
        defaultExpanded
        title={formatMessage({ id: 'Science' })}
        icon={
          <NewEntityButton
            to={`/ui/observations/import?caveId=${caveId}&locked=true`}
            size="small"
            tooltip={formatMessage({ id: 'Import observations' })}
            icon={<EntityIcon iconType="scientific_observation" size={20} />}
          />
        }
        content={
          <Alert
            severity="info"
            content={formatMessage({
              id: 'Science data integration in progress.'
            })}
          />
        }
      />
    </>
  );
};

ScienceSection.propTypes = {
  caveId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  entranceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  networkId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  networkName: PropTypes.string,
  isNetworkEntrance: PropTypes.bool
};

export default ScienceSection;
