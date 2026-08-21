import { useQuery } from '@tanstack/react-query';

import { getDocumentTypesUrl } from '../../conf/apiRoutes';
import { makeUrl } from '../../actions/utils';
import { apiGet } from '../../api/client';
import { referenceKeys } from '../../api/queryKeys';
import { REFERENCE_QUERY } from '../../conf/queryClient';

// The three types that head the list in every document form, in the order the
// forms expect. Everything else follows, each group sorted by name.
const FIRST_DOCUMENT_TYPES_TO_DISPLAY = ['Article', 'Collection', 'Issue'];

// localeCompare, where the thunk this replaces passed `(a, b) => a.name > b.name`.
// That returns a boolean, which coerces to 0 or 1 and never to -1, so the sort
// was not a sort — the order it produced was whatever the engine's algorithm
// happened to leave behind. This is a fix, and it changes the displayed order.
const byName = (a, b) => a.name.localeCompare(b.name);

// Module scope: see the note in useFileFormats about `select` identity.
const sortForDisplay = documentTypes => [
  ...documentTypes
    .filter(dt => FIRST_DOCUMENT_TYPES_TO_DISPLAY.includes(dt.name))
    .sort(byName),
  ...documentTypes
    .filter(dt => !FIRST_DOCUMENT_TYPES_TO_DISPLAY.includes(dt.name))
    .sort(byName)
];

/** Available document types, ordered for the document forms. */
export const useDocumentTypes = () =>
  useQuery({
    queryKey: referenceKeys.documentTypes(),
    queryFn: async () =>
      (await apiGet(makeUrl(getDocumentTypesUrl, { isAvailable: true })))
        .documentTypes,
    select: sortForDisplay,
    ...REFERENCE_QUERY
  });

export default useDocumentTypes;
