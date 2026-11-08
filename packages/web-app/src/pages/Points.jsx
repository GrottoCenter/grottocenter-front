import { useMemo, useState } from 'react';
import { Box, Divider } from '@mui/material';
import { useIntl } from 'react-intl';

import { SearchBooleanToggle } from '@/components/appli/AdvancedSearch/SearchElements';
import CustomIcon from '@/components/common/CustomIcon';
import EntityTable from '@/components/common/EntityTable';
import FetchErrorState from '@/components/common/FetchErrorState';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import NewEntityButton from '@/components/common/NewEntityButton';
import SearchInput from '@/components/common/SearchInput';
import { usePoints } from '@/hooks';
import { EntityIcon } from '@/pages/EntityCreation/entityConfig';

const normalize = value =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const Points = () => {
  const { formatMessage } = useIntl();
  const { data = [], error, isFetching, isPaused, refetch } = usePoints();
  const [search, setSearch] = useState('');
  const [underground, setUnderground] = useState(null);
  const points = useMemo(() => {
    const query = normalize(search.trim());
    return data.filter(point => {
      const matchesUnderground =
        underground === null || point.underground === underground;
      return matchesUnderground && normalize(point.label).includes(query);
    });
  }, [data, search, underground]);

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
            <Box data-testid="points-underground-filter">
              <SearchBooleanToggle
                label="points.underground"
                icon={<CustomIcon type="underground" size={24} />}
                value={underground}
                onChange={setUnderground}
                isInline
              />
            </Box>
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
            <EntityTable
              entityType="points"
              pageRows={points}
              nbTotalRows={points.length}
              isLoading={isFetching}
            />
          )}
        </>
      }
    />
  );
};

export default Points;
