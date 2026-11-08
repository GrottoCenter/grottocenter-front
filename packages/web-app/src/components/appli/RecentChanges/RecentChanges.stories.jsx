import { useState } from 'react';
import PropTypes from 'prop-types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { listKeys } from '@/api/queryKeys';
import {
  getRecentChangesFilters,
  RECENT_CHANGES_SCOPES,
  RECENT_CHANGES_CONFIG
} from '@/utils/recentChanges';
import RecentChangesSection from './Section';
import RecentChangesFeed from './Feed';

const changes = [
  {
    date: new Date(Date.now() - 3600000).toISOString(),
    authorId: 1,
    author: 'Camille',
    mainEntityType: 'entrance',
    mainEntityId: 42,
    mainAction: 'update',
    subEntityTypes: [],
    name: 'Grotte des Eaux Claires'
  }
];

const Example = ({
  scopeType,
  scopeId,
  state = 'populated',
  isGlobal = false
}) => {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } }
    });
    const key = listKeys.recentChanges({
      limit: RECENT_CHANGES_CONFIG.pageSize,
      mode: 'feed',
      filters: isGlobal
        ? {}
        : getRecentChangesFilters({
            [RECENT_CHANGES_SCOPES[scopeType].filter]: scopeId
          })
    });
    // Stories seed a local cache and disable automatic fetching.
    queryClient.setQueryDefaults(key, { enabled: false });
    if (state === 'error') {
      const query = queryClient
        .getQueryCache()
        .build(queryClient, { queryKey: key });
      query.setState({ status: 'error', error: new Error('Unavailable') });
    } else if (state !== 'loading') {
      queryClient.setQueryData(key, {
        pages: [{ changes: state === 'empty' ? [] : changes, hasMore: false }],
        pageParams: [0]
      });
    }
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      {isGlobal ? (
        <RecentChangesFeed />
      ) : (
        <RecentChangesSection scopeType={scopeType} scopeId={scopeId} />
      )}
    </QueryClientProvider>
  );
};
Example.propTypes = {
  ...RecentChangesSection.propTypes,
  state: PropTypes.oneOf(['populated', 'empty', 'loading', 'error']),
  isGlobal: PropTypes.bool
};

export default {
  title: 'Activity/RecentChanges',
  component: RecentChangesSection,
  args: { scopeType: 'massif', scopeId: 42 },
  render: ({ scopeType, scopeId, state, isGlobal }) => (
    <Example
      key={`${scopeType}-${scopeId}-${state}-${isGlobal}`}
      scopeType={scopeType}
      scopeId={scopeId}
      state={state}
      isGlobal={isGlobal}
    />
  )
};

export const Massif = {};
export const Country = { args: { scopeType: 'country', scopeId: 'FR' } };
export const Region = { args: { scopeType: 'region', scopeId: 'FR-ARA' } };
export const Organization = { args: { scopeType: 'organization' } };
export const Empty = { args: { state: 'empty' } };
export const Loading = { args: { state: 'loading' } };
export const Failure = { args: { state: 'error' } };
export const GlobalFeed = { args: { isGlobal: true } };
