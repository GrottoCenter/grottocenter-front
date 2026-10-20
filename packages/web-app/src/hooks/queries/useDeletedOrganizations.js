import { useInfiniteQuery } from '@tanstack/react-query';

import { apiGetWithRange } from '@/api/client';
import { organizationKeys } from '@/api/queryKeys';
import { getOrganizationsUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { getTotalCount, makeUrl } from '@/actions/utils';

const PAGE_SIZE = 50;
const CRITERIA = { isDeleted: true, limit: PAGE_SIZE };

const validateDeletedPage = page => {
  const organizations = page.data?.organizations;
  // Older API deployments ignore isDeleted and return ten active rows.
  // Reject that response rather than label active organizations as deleted.
  if (
    !Array.isArray(organizations) ||
    organizations.some(organization => organization?.isDeleted !== true) ||
    (organizations.length > 0 && !/\/\d+$/.test(page.contentRange ?? ''))
  ) {
    const error = new Error('Invalid deleted organizations response');
    error.code = 'deletedOrganizations.listUnavailable';
    throw error;
  }
  return page;
};

const selectOrganizations = data => {
  // Validate cached pages too, including responses retained during hot reload.
  data.pages.forEach(validateDeletedPage);
  return {
    ...data,
    organizations: data.pages.flatMap(page => page.data.organizations),
    totalCount: getTotalCount(
      data.pages[0].data.organizations.length,
      data.pages[0].contentRange
    )
  };
};

export const useDeletedOrganizations = ({ enabled = true } = {}) =>
  useInfiniteQuery({
    queryKey: organizationKeys.list(CRITERIA),
    queryFn: ({ pageParam }) =>
      apiGetWithRange(
        makeUrl(getOrganizationsUrl, { ...CRITERIA, skip: pageParam })
      ).then(validateDeletedPage),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce(
        (count, page) => count + page.data.organizations.length,
        0
      );
      const total = getTotalCount(
        lastPage.data.organizations.length,
        lastPage.contentRange
      );
      return lastPage.data.organizations.length && loaded < total
        ? loaded
        : undefined;
    },
    select: selectOrganizations,
    enabled,
    retry: false,
    staleTime: STALE.VOLATILE
  });
