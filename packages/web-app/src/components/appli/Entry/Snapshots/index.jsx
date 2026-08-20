import { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, Skeleton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';

import PageContainer from '../../../common/Layouts/PageContainer';
import PageHeader from '../../../common/Layouts/PageHeader';
import SectionStack from '../../../common/Layouts/SectionStack';
import { fetchSnapshot } from '../../../../actions/Snapshot/GetSnapshots';
import { fetchEntrance } from '../../../../actions/Entrance/GetEntrance';
import { fetchCave } from '../../../../actions/Cave/GetCave';
import { loadMassif } from '../../../../actions/Massif/GetMassif';
import { fetchPerson } from '../../../../actions/Person/GetPerson';
import { fetchOrganization } from '../../../../actions/Organization/GetOrganization';
import { useDocument } from '../../../../hooks';
import { documentKeys } from '../../../../api/queryKeys';
import REDUCER_STATUS from '../../../../reducers/ReducerStatus';
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
  const dispatch = useDispatch();
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
  // Some entities (e.g. guidelines) have no standalone route to re-fetch the
  // current item from, so their soft-delete state travels in the URL instead.
  const hasIsDeletedParam = queryParameters.has('isDeleted');
  const isDeletedParam = queryParameters.get('isDeleted') === 'true';

  const { id, type } = useParams();

  // All entity selectors declared unconditionally (rules of hooks)
  const { data: currentEntrance, loading: isEntranceLoading } = useSelector(
    s => s.entrance
  );
  const { cave: currentCave, loading: isCaveLoading } = useSelector(
    s => s.cave
  );
  // useDocument is gated on type so the query stays disabled — no wasted
  // request — when this page renders any other entity.
  const documentQuery = useDocument(type === 'documents' ? id : undefined);
  const currentDocument = documentQuery.data ?? null;
  const isDocumentLoading = documentQuery.isFetching;
  const { massif: currentMassif, isFetching: isMassifLoading } = useSelector(
    s => s.massif
  );
  const { person: currentPerson, isFetching: isPersonLoading } = useSelector(
    s => s.person
  );
  const {
    organization: currentOrganization,
    isLoading: isOrganizationLoading
  } = useSelector(s => s.organization);

  const { data, status, latestHttpCode } = useSelector(
    state => state.snapshots
  );

  useEffect(() => {
    dispatch(fetchSnapshot(id, type, isNetwork, getAll));
  }, [id, type, isNetwork, getAll, dispatch]);

  const isSubEntityType = SUB_ENTITY_TYPES.includes(type);

  useEffect(() => {
    const fetchByType = {
      entrances: () => dispatch(fetchEntrance(id)),
      caves: () => dispatch(fetchCave(id)),
      documents: () =>
        queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) }),
      massifs: () => dispatch(loadMassif(id)),
      persons: () => dispatch(fetchPerson(id)),
      organizations: () => dispatch(fetchOrganization(id))
    };
    const fetchParentByType = {
      entrances: pId => dispatch(fetchEntrance(pId)),
      massifs: pId => dispatch(loadMassif(pId))
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
  }, [id, type, parentId, parentType, isSubEntityType, dispatch, queryClient]);

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
    // Guidelines have no route to fetch from; the marker only carries isDeleted
    // to gate the rollback button and intentionally renders no "current" card.
    guidelines: [
      hasIsDeletedParam ? { isDeleted: isDeletedParam } : null,
      false
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

  const isLoading = status === REDUCER_STATUS.LOADING;
  const isSuccess = status === REDUCER_STATUS.SUCCEEDED;
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
                  data={sortSnapshots(data)}
                  type={type}
                  isNetwork={isNetwork}
                  currentTItem={currentTItem}
                  isCurrentItemLoading={isCurrentItemLoading}
                />
              ) : (
                <AccordionSnapshotList
                  data={data}
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
