import { apiPost } from '@/api/client';
import { personKeys } from '@/api/queryKeys';
import { advancedSearchUrl } from '@/conf/apiRoutes';
import { scanSearchPages } from '@/utils/scanSearchPages';
import { analyzePersonDuplicates } from '@/utils/analyzePersonDuplicates';
import { useDuplicateScan } from './useDuplicateScan';

const getPage = ({ pageParam, signal }) =>
  apiPost(
    advancedSearchUrl,
    {
      entity: 'persons',
      query: '',
      filter: {},
      matchAllFields: true,
      sort: 'surname:asc,name:asc',
      size: 1000,
      page: pageParam
    },
    { signal }
  );

const load = async ({ signal, onProgress }) => {
  const persons = await scanSearchPages({
    getPage,
    signal,
    onProgress,
    requireUniqueIds: true,
    incompleteMessage: 'duplicates.incompleteScan'
  });
  const count = persons.length;
  onProgress({ loaded: 0, total: count, phase: 'matching' });
  const pairs = await analyzePersonDuplicates(persons, { signal, onProgress });
  onProgress({ loaded: count, total: count });
  return pairs;
};

export const useAuthorDuplicateScan = ({ enabled }) =>
  useDuplicateScan({ queryKey: personKeys.duplicates, load, enabled });
