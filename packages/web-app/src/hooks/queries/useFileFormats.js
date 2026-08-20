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
 * @returns {{mimeTypes: string[], extensions: string[], loading: boolean, error: ?Error}}
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
    loading: isLoading,
    error
  };
};

export default useFileFormats;
