import { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, Skeleton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';

import PageContainer from '../../../common/Layouts/PageContainer';
import PageHeader from '../../../common/Layouts/PageHeader';
import SectionStack from '../../../common/Layouts/SectionStack';
import {
  useCave,
  useDocument,
  useEntrance,
  useGuideline,
  useMassif,
  useOrganization,
  usePerson,
  useSnapshots
} from '../../../../hooks';
import {
  caveKeys,
  documentKeys,
  entranceKeys,
  guidelineKeys,
  massifKeys,
  organizationKeys,
  personKeys
} from '../../../../api/queryKeys';
import SensitiveCaveWarning from '../SensitiveCaveWarning';
import AccordionSnapshotList from './AccordionSnapshotList';
import Alert403 from './error/403Alert';
import Alert404 from './error/404Alert';
import { sortSnapshots } from './UtilityFunction';
import AccordionSnapshotListPage from './AccordionSnapshotListPage';
import { capitalize } from '../../../../utils/strings';

const SUB_ENTITY_TYPES = [
  'descriptions',
  'locations',
  'histories',
  'riggings',
  'comments'
];

const SnapshotPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const queryParameters = new URLSearchParams(location.search);
  const isNetwork = queryParameters.get('isNetwork') === 'true';
  const getAll = queryParameters.get('all') === 'true';
  const parentId = queryParameters.get('parentId');
  const parentType = queryParameters.get('parentType');
  const backTo = queryParameters.get('backTo');
  // Compatibility for history links generated before guidelines gained their
  // standalone detail query, and for soft-deleted guidelines until api#1782.
  const hasIsDeletedParam = queryParameters.has('isDeleted');
  const isDeletedParam = queryParameters.get('isDeleted') === 'true';

  const { id, type } = useParams();

  // Each entity query is gated on type so it stays disabled — no wasted
  // request — when this page renders any other entity. The entrance query
  // additionally covers sub-entities (descriptions/locations/…) whose parent
  // fetch used to run through the entrance slice; parentType/parentId route
  // to the same hook.
  let relevantEntranceId;
  if (type === 'entrances') relevantEntranceId = id;
  else if (parentType === 'entrances' || !parentType)
    relevantEntranceId = parentId;
  const entranceQuery = useEntrance(relevantEntranceId);
  const currentEntrance = entranceQuery.data ?? null;
  const isEntranceLoading = entranceQuery.isFetching;
  const caveQuery = useCave(type === 'caves' ? id : undefined);
  const currentCave = caveQuery.data ?? null;
  const isCaveLoading = caveQuery.isFetching;
  const documentQuery = useDocument(type === 'documents' ? id : undefined);
  const currentDocument = documentQuery.data ?? null;
  const isDocumentLoading = documentQuery.isFetching;
  let relevantMassifId;
  if (type === 'massifs') relevantMassifId = id;
  else if (parentType === 'massifs') relevantMassifId = parentId;
  const massifQuery = useMassif(relevantMassifId);
  const currentMassif = massifQuery.data ?? null;
  const isMassifLoading = massifQuery.isFetching;
  const personQuery = usePerson(type === 'persons' ? id : undefined);
  const currentPerson = personQuery.data ?? null;
  const isPersonLoading = personQuery.isFetching;
  const organizationQuery = useOrganization(
    type === 'organizations' ? id : undefined
  );
  const currentOrganization = organizationQuery.data ?? null;
  const isOrganizationLoading = organizationQuery.isFetching;
  const guidelineQuery = useGuideline(type === 'guidelines' ? id : undefined);
  const currentGuideline = guidelineQuery.data ?? null;
  const isGuidelineLoading = guidelineQuery.isFetching;

  const {
    data: snapshotData = {},
    isFetching: isSnapshotFetching,
    isSuccess,
    error: snapshotError
  } = useSnapshots(id, type, { isNetwork, getAll });
  const latestHttpCode = snapshotError?.status;

  const isSubEntityType = SUB_ENTITY_TYPES.includes(type);

  useEffect(() => {
    const fetchByType = {
      entrances: () =>
        queryClient.invalidateQueries({ queryKey: entranceKeys.detail(id) }),
      caves: () =>
        queryClient.invalidateQueries({ queryKey: caveKeys.detail(id) }),
      documents: () =>
        queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) }),
      massifs: () =>
        queryClient.invalidateQueries({ queryKey: massifKeys.detail(id) }),
      persons: () =>
        queryClient.invalidateQueries({ queryKey: personKeys.detail(id) }),
      organizations: () =>
        queryClient.invalidateQueries({
          queryKey: organizationKeys.detail(id)
        }),
      guidelines: () =>
        queryClient.invalidateQueries({ queryKey: guidelineKeys.detail(id) })
    };
    const fetchParentByType = {
      entrances: pId =>
        queryClient.invalidateQueries({ queryKey: entranceKeys.detail(pId) }),
      massifs: pId =>
        queryClient.invalidateQueries({ queryKey: massifKeys.detail(pId) })
    };
    if (isSubEntityType) {
      if (parentId) {
        const fetchParent = Object.hasOwn(fetchParentByType, parentType)
          ? fetchParentByType[parentType]
          : fetchParentByType.entrances;
        fetchParent(parentId);
      }
    } else if (Object.hasOwn(fetchByType, type)) {
      fetchByType[type]();
    }
  }, [id, type, parentId, parentType, isSubEntityType, queryClient]);

  const parentDataByType = {
    entrances: currentEntrance,
    massifs: currentMassif
  };
  const parentData = parentDataByType[parentType] ?? currentEntrance;
  const isParentLoading =
    parentType === 'massifs' ? isMassifLoading : isEntranceLoading;

  const currentSubEntity =
    isSubEntityType && parentData
      ? ((parentData[type] ?? []).find(item => String(item.id) === id) ?? null)
      : null;

  const entityByType = {
    entrances: [currentEntrance, isEntranceLoading],
    caves: [currentCave, isCaveLoading],
    documents: [currentDocument, isDocumentLoading],
    massifs: [currentMassif, isMassifLoading],
    persons: [currentPerson, isPersonLoading],
    organizations: [currentOrganization, isOrganizationLoading],
    guidelines: [
      currentGuideline ??
        (hasIsDeletedParam ? { isDeleted: isDeletedParam } : null),
      isGuidelineLoading
    ],
    descriptions: [currentSubEntity, isParentLoading],
    locations: [currentSubEntity, isParentLoading],
    histories: [currentSubEntity, isParentLoading],
    riggings: [currentSubEntity, isParentLoading],
    comments: [currentSubEntity, isParentLoading]
  };
  const [currentTItem, isCurrentItemLoading] = entityByType[type] ?? [
    null,
    false
  ];

  // 404 is swallowed by useSnapshots (empty history is a legitimate success);
  // is404 only fires if the API ever changes and 404 leaks out as an error.
  const isLoading = isSnapshotFetching && !isSuccess;
  const is404 = !isSuccess && latestHttpCode === 404;
  const is403 = !isSuccess && latestHttpCode === 403;
  const isSensitive = currentTItem?.isSensitive ?? false;

  const TYPE_SINGULAR = {
    entrances: 'Entrance',
    caves: 'Cave',
    documents: 'Document',
    massifs: 'Massif',
    persons: 'Person',
    organizations: 'Organization',
    descriptions: 'Description',
    locations: 'Access',
    histories: 'History',
    riggings: 'Rigging',
    comments: 'Comment'
  };

  const TYPE_PAGE_TITLE = {
    ...TYPE_SINGULAR,
    entrances: 'Information'
  };

  const entityName = currentTItem?.title ?? currentTItem?.name;
  const pageTitle = isCurrentItemLoading
    ? undefined
    : formatMessage(
        { id: 'Revision history: {type}' },
        {
          type:
            getAll && entityName
              ? entityName
              : formatMessage({
                  id: TYPE_PAGE_TITLE[type] ?? capitalize(type)
                })
        }
      );

  // Prefer the exact page the history was opened from (passed as `backTo`).
  // Fall back to a rebuilt URL for older links that predate the param.
  const backTarget =
    backTo ||
    (parentId && parentType
      ? `/ui/${parentType}/${parentId}`
      : `/ui/${type}/${id}`);
  const backLabel = formatMessage(
    { id: 'Back to {type}' },
    {
      type: formatMessage({
        id: TYPE_SINGULAR[parentType ?? type] ?? capitalize(parentType ?? type)
      })
    }
  );

  const backLink = (
    <Button
      variant="outlined"
      size="small"
      color="primary"
      startIcon={<ArrowBackIcon />}
      onClick={() => navigate(backTarget)}>
      {backLabel}
    </Button>
  );

  return (
    <PageContainer>
      <PageHeader
        title={pageTitle}
        icon={
          getAll ? (
            <ManageHistoryIcon fontSize="inherit" />
          ) : (
            <HistoryIcon fontSize="inherit" />
          )
        }
        subheader={backLink}
      />
      <SectionStack>
        {isSensitive && <SensitiveCaveWarning />}
        <Card>
          <CardContent sx={{ p: 0.25, '&:last-child': { pb: 0.25 } }}>
            {is403 && <Alert403 type={type} />}
            {is404 && <Alert404 type={type} />}
            {isLoading && <Skeleton height={300} />}
            {isSuccess &&
              (getAll ? (
                <AccordionSnapshotListPage
                  data={sortSnapshots(snapshotData)}
                  type={type}
                  isNetwork={isNetwork}
                  currentTItem={currentTItem}
                  isCurrentItemLoading={isCurrentItemLoading}
                />
              ) : (
                <AccordionSnapshotList
                  data={snapshotData}
                  type={type}
                  isNetwork={isNetwork}
                  currentItem={currentTItem}
                  isCurrentItemLoading={isCurrentItemLoading}
                />
              ))}
          </CardContent>
        </Card>
      </SectionStack>
    </PageContainer>
  );
};

export default SnapshotPage;
