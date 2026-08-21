import { useQuery } from '@tanstack/react-query';

import { getFileFormatsUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { referenceKeys } from '../../api/queryKeys';
import { REFERENCE_QUERY } from '../../conf/queryClient';

const EMPTY = [];

// Module scope, not an inline arrow: React Query re-runs `select` whenever its
// identity changes, so an inline one would rebuild this object on every render
// and hand consumers a new reference each time.
const toMimesAndExtensions = fileFormats => ({
  mimeTypes: fileFormats.map(f => f.mimeType),
  extensions: fileFormats.map(f => f.extension)
});

/**
 * Accepted upload formats, as the two lists the file pickers need.
 *
 * Named top-level fields rather than raw `data`, because this hook is one of
 * the exceptions to the list-hook convention (see ADR): it transforms the API
 * shape into two derived arrays. `isLoading`/`error` keep the useQuery naming.
 *
 * @returns {{mimeTypes: string[], extensions: string[], isLoading: boolean, error: ?Error}}
 */
export const useFileFormats = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: referenceKeys.fileFormats(),
    queryFn: async () => (await apiGet(getFileFormatsUrl)).fileFormats,
    select: toMimesAndExtensions,
    ...REFERENCE_QUERY
  });

  return {
    mimeTypes: data?.mimeTypes ?? EMPTY,
    extensions: data?.extensions ?? EMPTY,
    isLoading,
    error
  };
};

export default useFileFormats;
