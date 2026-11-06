import { useMemo, useState } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import EntityTypeFilter from '@/components/appli/AdvancedSearch/EntityTypeFilter';
import { SearchFieldset } from '@/components/appli/AdvancedSearch/SearchElements';
import CustomIcon from '@/components/common/CustomIcon';
import EntityTable from '@/components/common/EntityTable';
import FetchErrorState from '@/components/common/FetchErrorState';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import NewEntityButton from '@/components/common/NewEntityButton';
import SearchInput from '@/components/common/SearchInput';
import { usePoints } from '@/hooks';
import { EntityIcon } from '@/pages/EntityCreation/entityConfig';

const DEPTH_OPTIONS = [
  { value: 'all', labelId: 'All' },
  { value: 'false', labelId: 'points.surface' },
  { value: 'true', labelId: 'points.underground' }
];

const normalize = value =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const Points = () => {
  const { formatMessage } = useIntl();
  const { data = [], error, isFetching, isPaused, refetch } = usePoints();
  const [search, setSearch] = useState('');
  const [depth, setDepth] = useState('all');
  const points = useMemo(() => {
    const query = normalize(search.trim());
    return data.filter(point => {
      const matchesDepth =
        depth === 'all' || String(point.underground) === depth;
      return matchesDepth && normalize(point.label).includes(query);
    });
  }, [data, search, depth]);

  return (
    <Layout
      title={formatMessage({ id: 'Points' })}
      icon={<CustomIcon type="point" />}
      action={
        <NewEntityButton
          to="/ui/entity/add/point"
          icon={<EntityIcon iconType="point" size={20} />}
        />
      }
      content={
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
            <Box data-testid="points-search" sx={{ width: '100%' }}>
              <SearchInput value={search} onChange={setSearch} />
            </Box>
            <SearchFieldset title="Depth">
              <EntityTypeFilter
                labelId="Depth"
                options={DEPTH_OPTIONS}
                value={depth}
                onChange={setDepth}
              />
            </SearchFieldset>
          </Box>
          <Divider sx={{ my: 1 }} />
          {error || isPaused ? (
            <FetchErrorState
              error={error}
              isPaused={isPaused}
              messageId="points.fetchError"
              onRetry={refetch}
            />
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1 }} role="status">
                {formatMessage(
                  { id: 'results_count' },
                  { count: points.length }
                )}
              </Typography>
              <EntityTable
                entityType="points"
                pageRows={points}
                nbTotalRows={points.length}
                isLoading={isFetching}
                shouldHideFooter
              />
            </>
          )}
        </>
      }
    />
  );
};

export default Points;
