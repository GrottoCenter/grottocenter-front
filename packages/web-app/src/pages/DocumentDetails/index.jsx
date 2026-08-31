import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Box, Breadcrumbs, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ShareIcon from '@mui/icons-material/Share';
import { NavigateNext } from '@mui/icons-material';
import { LicenseBadge } from '@/components/common/LicenseTag';
import {
  DEFAULT_COLLECTION_SORT_ORDER,
  DOCUMENT_SORT_ORDERS,
  sortDocuments
} from '@/utils/documentSort';
import { getIssuesYearRange } from '@/utils/documentChildrenLabel';
import LinkedEntitiesList, {
  ListElement,
  TextLink
} from '@/components/common/LinkedEntitiesList';
import AppLink from '../../components/common/AppLink';

import useOpenLink from '../../hooks/useOpenLink';
import CustomIcon from '../../components/common/CustomIcon';
import DocumentTypeChip from '../../components/common/DocumentTypeChip';
import {
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_FALLBACK_ICON,
  DocumentTypes,
  documentTypeHelpers
} from '../../utils/documentTypeHelpers';
import {
  DetailItem,
  DetailsList,
  EmptySection,
  EventDateSection,
  FilesSection,
  SummaryText
} from './Section';
import DocumentChildrenList, {
  ChildrenControls,
  ChildrenSectionHeader,
  DocumentChildrenTiles
} from './DocumentChildrenList';
import {
  useDocument,
  useDocumentChildren,
  useDeleteDocument,
  useRestoreDocument,
  useLanguages,
  useLicenses,
  findLicenseByName,
  usePermissions,
  useSharePage
} from '../../hooks';
import PageContainer from '../../components/common/Layouts/PageContainer';
import PageHeader from '../../components/common/Layouts/PageHeader';
import SectionStack from '../../components/common/Layouts/SectionStack';
import ResponsiveActions from '../../components/common/Layouts/ResponsiveActions';
import ScrollableContent, {
  CountBadge
} from '../../components/common/Layouts/Fixed/ScrollableContent';
import Alert from '../../components/common/Alert';
import FetchErrorState from '../../components/common/FetchErrorState';
import {
  DeleteConfirmationDialog,
  Deleted,
  DELETED_ENTITIES,
  DeletedCard
} from '../../components/common/card/Deleted';
import AuthorAndDate from '../../components/common/Contribution/AuthorAndDate';
import {
  DocumentChildPropTypes,
  DocumentPropTypes
} from '../../types/document.type';

// An authorization document is by definition of the "Authorization To Publish"
// type, so its icon is fixed: the simple shape the API returns here carries no
// `type` field to look it up from.
const AuthorizationIcon =
  DOCUMENT_TYPE_ICONS[DocumentTypes.AUTHORIZATION_TO_PUBLISH];

const HalfSplitContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    flex-direction: row;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

const MainColumn = styled('div')`
  flex: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const SideColumn = styled('div', {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};

  /* Collections only: their main column is a grid of dozens of issue tiles, so
     once the columns stack on a phone the metadata would land far below the
     fold — the notice has to stay next to the title it describes. Restricted to
     below md, since side by side the panel is already in the right place. */
  ${({ theme, $firstOnMobile }) =>
    $firstOnMobile &&
    `${theme.breakpoints.down('md')} {
       order: -1;
     }`}
`;

const Document = ({
  isLoading = true,
  error,
  isPaused = false,
  onRetry = null,
  documentData,
  documentChildren,
  hideActions = false
}) => {
  const { formatMessage } = useIntl();
  const openLink = useOpenLink();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const deleteMutation = useDeleteDocument();
  const restoreMutation = useRestoreDocument();
  const { data: languages = [] } = useLanguages();
  const { locale } = useSelector(state => state.intl);
  const { data: licenses } = useLicenses();
  const [issuesSortOrder, setIssuesSortOrder] = useState(
    DEFAULT_COLLECTION_SORT_ORDER
  );
  // Articles inside a collection rarely carry their own publication date, so
  // the alphabetical order is the one that actually helps here.
  const [articlesSortOrder, setArticlesSortOrder] = useState(
    DOCUMENT_SORT_ORDERS.TITLE
  );
  const [otherSortOrder, setOtherSortOrder] = useState(
    DEFAULT_COLLECTION_SORT_ORDER
  );
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);
  const handleShare = useSharePage();

  useEffect(() => {
    if (documentData) setWantedDeletedState(documentData.isDeleted);
  }, [documentData]);

  // The document detail only carries the license name; resolve the full license
  // object (for its deed URL) from the licenses list.
  //
  // Stay `undefined` until the licenses list is loaded — otherwise the badge
  // renders once with the bare name string (no deed URL), then re-renders as
  // an object once the list arrives, causing a visible flicker where the
  // link suddenly materialises.
  const licenseObject = licenses
    ? (findLicenseByName(licenses, documentData?.license) ??
        documentData?.license) ||
      undefined
    : undefined;

  let onEdit = null;
  let onDelete = null;
  if (permissions.isAuth && !documentData?.isDeleted) {
    if (documentData?.isValidated) {
      onEdit = () => {
        navigate(`/ui/documents/${documentData.id}/edit`);
      };
    }
    if (permissions.isModerator) {
      onDelete = () => {
        setIsDeleteConfirmationPermanent(false);
        setIsDeleteConfirmationOpen(true);
      };
    }
  }

  const onDeletePress = (entityId, isPermanent) => {
    setWantedDeletedState(true);
    deleteMutation.mutate({ id: documentData.id, entityId, isPermanent });
    if (isPermanent) navigate('/', { replace: true });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    restoreMutation.mutate({ id: documentData.id });
  };

  const mainLanguage =
    documentData?.mainLanguage === '000' ? null : documentData?.mainLanguage;

  const allAuthors = useMemo(() => {
    if (!documentData) return null;
    const items = [
      ...(documentData.authors ?? []).map(a => ({
        id: `caver-${a.id}`,
        name: a.nickname,
        iconType: 'caver',
        url: `/ui/persons/${a.id}`
      })),
      ...(documentData.authorsOrganization ?? []).map(a => ({
        id: `org-${a.id}`,
        name: a.name,
        iconType: 'organization',
        url: `/ui/organizations/${a.id}`
      }))
    ];
    if (items.length === 0) return null;
    return items.flatMap((a, i) => {
      const entry = (
        <TextLink
          key={a.id}
          icon={<CustomIcon type={a.iconType} size={18} />}
          value={a.name}
          url={a.url}
        />
      );
      return i < items.length - 1 ? [entry, ' · '] : [entry];
    });
  }, [documentData]);

  const pageFiles = useMemo(() => {
    if (!documentData?.parent?.files?.length) return [];
    const file = documentData.parent.files[0];
    const parentExt = file.fileName?.match(/\.[^.]+$/)?.[0] ?? '';
    const pageRegex = /^(\d+)(?:-(\d+))?$/;
    return String(documentData.pages ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .flatMap(segment => {
        const match = segment.match(pageRegex);
        if (!match) return [];
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : null;
        const completePath = `${file.completePath}#page=${start}`;
        const label = formatMessage(
          {
            id: end
              ? 'Pages {start}-{end} of {title}'
              : 'Page {start} of {title}'
          },
          { start, end, title: documentData.parent.title }
        );
        return [{ fileName: `${label}${parentExt}`, completePath }];
      });
  }, [documentData, formatMessage]);

  const allFiles = useMemo(
    () => [...(documentData?.files ?? []), ...pageFiles],
    [documentData, pageFiles]
  );

  const childIssues = useMemo(
    () => (documentChildren ?? []).filter(d => d.type === 'Issue'),
    [documentChildren]
  );
  const sortedChildIssues = useMemo(
    () => sortDocuments(childIssues, issuesSortOrder, locale),
    [childIssues, issuesSortOrder, locale]
  );
  const childArticles = useMemo(
    () => (documentChildren ?? []).filter(d => d.type === 'Article'),
    [documentChildren]
  );
  const sortedChildArticles = useMemo(
    () => sortDocuments(childArticles, articlesSortOrder, locale),
    [childArticles, articlesSortOrder, locale]
  );
  const childOther = useMemo(
    () =>
      (documentChildren ?? []).filter(
        d => d.type !== 'Issue' && d.type !== 'Article'
      ),
    [documentChildren]
  );
  const sortedChildOther = useMemo(
    () => sortDocuments(childOther, otherSortOrder, locale),
    [childOther, otherSortOrder, locale]
  );

  // Holdings statement: the span the run actually covers.
  const issuesYearRange = useMemo(
    () => getIssuesYearRange(childIssues),
    [childIssues]
  );

  const linkedEntities = useMemo(() => {
    if (!documentData) return [];
    return [
      ...(documentData.massifs ?? []).map(e => (
        <ListElement
          key={`massif-${e.id}`}
          icon={<CustomIcon type="massif" />}
          value={e.name}
          secondary={formatMessage({ id: 'Massif' })}
          url={`/ui/massifs/${e.id}`}
        />
      )),
      documentData.cave && (
        <ListElement
          key={`cave-${documentData.cave.id}`}
          icon={<CustomIcon type="network" />}
          value={documentData.cave.name}
          secondary={formatMessage({ id: 'Cave' })}
          url={`/ui/caves/${documentData.cave.id}`}
        />
      ),
      ...(documentData.entrances ?? []).map(entrance => (
        <ListElement
          key={`entrance-${entrance.id}`}
          icon={<CustomIcon type="entrance" />}
          value={entrance.name}
          secondary={formatMessage({ id: 'Entrance' })}
          url={`/ui/entrances/${entrance.id}`}
        />
      ))
    ].filter(Boolean);
  }, [documentData, formatMessage]);

  const { isCollection, isEvent } = documentTypeHelpers;
  const docType = documentData?.type;

  const isActionLoading = wantedDeletedState !== documentData?.isDeleted;

  const snapshotUrl = documentData
    ? `/ui/documents/${documentData.id}/snapshots`
    : null;

  const needsValidation =
    !isLoading &&
    documentData &&
    permissions.isAuth &&
    !documentData?.isValidated;

  const ParentTypeIcon =
    (documentData?.parent?.type &&
      DOCUMENT_TYPE_ICONS[documentData.parent.type]) ||
    DOCUMENT_TYPE_FALLBACK_ICON;
  const breadcrumb = documentData?.parent ? (
    <Breadcrumbs separator={<NavigateNext fontSize="inherit" />}>
      <AppLink
        to={`/ui/documents/${documentData.parent.id}`}
        underline="hover"
        color="inherit"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: '4px', md: '6px' }
        }}>
        <ParentTypeIcon sx={{ fontSize: 'inherit' }} />
        {documentData.parent.title}
      </AppLink>
    </Breadcrumbs>
  ) : null;

  // A collection is the root of its hierarchy, so its subheader slot is free for
  // the holdings statement. If one ever does have a parent, navigation wins.
  const coverage =
    isCollection(docType) && issuesYearRange ? (
      <Typography variant="body1" color="textSecondary">
        {formatMessage(
          {
            id:
              issuesYearRange.start === issuesYearRange.end
                ? 'Published in {year}'
                : 'Published from {start} to {end}'
          },
          { ...issuesYearRange, year: issuesYearRange.start }
        )}
      </Typography>
    ) : null;

  const actions = hideActions ? null : (
    <ResponsiveActions
      items={[
        {
          key: 'share',
          icon: <ShareIcon />,
          label: formatMessage({ id: 'Copy link' }),
          onClick: handleShare
        },
        {
          key: 'edit',
          icon: <CreateIcon />,
          label: formatMessage({ id: 'Edit properties' }),
          onClick: onEdit,
          hidden: !onEdit
        },
        {
          key: 'snapshot',
          icon: <ManageHistoryIcon />,
          label: formatMessage({ id: 'Page history' }),
          onClick: snapshotUrl ? () => openLink(snapshotUrl) : undefined,
          hidden: !snapshotUrl
        },
        {
          key: 'delete',
          icon: <DeleteIcon />,
          label: formatMessage({ id: 'Delete' }),
          onClick: onDelete,
          hidden: !onDelete,
          destructive: true
        }
      ]}
    />
  );

  // What sits under the description depends on the document type: a
  // collection lists its issues, an event shows its date, anything else
  // shows the attached files.
  let bodySection = <FilesSection files={allFiles} />;
  if (isCollection(docType)) {
    bodySection = (
      <Box>
        <ChildrenSectionHeader
          title={
            // h2 in secondary with the shared CountBadge, exactly like
            // ScrollableContent's own titles: this is a section heading among
            // its peers, and h5 under the page's h1 skipped three levels for
            // no reason.
            <Typography variant="h2" color="secondary">
              {formatMessage({ id: 'Issues' })}
              <CountBadge count={childIssues.length} />
            </Typography>
          }
          controls={
            <ChildrenControls
              documents={childIssues}
              sortOrder={issuesSortOrder}
              onSortOrderChange={setIssuesSortOrder}
            />
          }
        />
        {childIssues.length > 0 ? (
          <DocumentChildrenTiles
            documents={sortedChildIssues}
            collectionTitle={documentData.title}
          />
        ) : (
          <EmptySection
            icon={<NewspaperIcon fontSize="large" color="disabled" />}
            message={formatMessage({
              id: 'No issues in this collection.'
            })}
          />
        )}
      </Box>
    );
  } else if (isEvent(docType)) {
    bodySection = <EventDateSection date={documentData.datePublication} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={documentData?.title ?? (isLoading ? undefined : '')}
        icon={<CustomIcon type="bibliography" />}
        subheader={breadcrumb ?? coverage}
        actions={actions}
      />
      <DeleteConfirmationDialog
        entityType={DELETED_ENTITIES.document}
        isOpen={isDeleteConfirmationOpen}
        isLoading={isActionLoading}
        isPermanent={isDeleteConfirmationPermanent}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        onConfirmation={entity => {
          onDeletePress(entity?.id, isDeleteConfirmationPermanent);
        }}
      />
      {/* One stack for the whole body rather than one per branch: a deleted
          document still renders its sections underneath the notice, and an
          error can arrive while the children are still loading. */}
      <SectionStack>
        {documentData?.isDeleted && (
          <ScrollableContent
            content={
              <DeletedCard
                entityType={DELETED_ENTITIES.document}
                entity={documentData}
                isLoading={isActionLoading}
                standalone={false}
                onRestorePress={onRestorePress}
                onPermanentDeletePress={() => {
                  setIsDeleteConfirmationPermanent(true);
                  setIsDeleteConfirmationOpen(true);
                }}
              />
            }
          />
        )}
        {isLoading && (
          <ScrollableContent
            content={
              <>
                <Skeleton width={75} />
                <Skeleton />
                <Skeleton width={100} />
                <Skeleton variant="rectangular" height={150} />
                <Skeleton width={125} />
                <Skeleton variant="rectangular" height={80} />
              </>
            }
          />
        )}
        {(error || isPaused) && (
          <ScrollableContent
            content={
              <FetchErrorState
                error={error}
                isPaused={isPaused}
                onRetry={onRetry}
                messageId="Error, the document data you are looking for is not available."
              />
            }
          />
        )}
        {documentData && (
          <>
            <ScrollableContent
              content={
                <>
                  <HalfSplitContainer>
                    <MainColumn>
                      {needsValidation && (
                        <Alert
                          severity="warning"
                          content={formatMessage({
                            id: 'A moderator needs to validate the last modification before being able to edit the document again.'
                          })}
                        />
                      )}
                      <SummaryText>{documentData.description}</SummaryText>
                      {bodySection}
                    </MainColumn>
                    <SideColumn $firstOnMobile={isCollection(docType)}>
                      <DetailsList>
                        <DetailItem
                          label={formatMessage({ id: 'Type' })}
                          value={
                            documentData.type ? (
                              <DocumentTypeChip type={documentData.type} />
                            ) : null
                          }
                        />
                        <DetailItem
                          label={formatMessage({ id: 'Language' })}
                          value={
                            languages.find(e => e.id === mainLanguage)
                              ?.refName ?? mainLanguage
                          }
                        />
                        <DetailItem
                          label={formatMessage({ id: 'Publication date' })}
                          value={documentData.datePublication}
                        />
                        <DetailItem
                          label={formatMessage({ id: 'Pages' })}
                          value={documentData.pages}
                        />
                        <DetailItem
                          label={formatMessage({ id: 'Issue' })}
                          value={documentData.issue}
                        />
                        {/* License only applies to attached files, not to the paper document itself */}
                        {allFiles.length > 0 && documentData.license && (
                          <DetailItem
                            label={formatMessage({ id: 'License' })}
                            value={
                              <LicenseBadge
                                license={licenseObject}
                                linkToDeed
                                size={40}
                              />
                            }
                          />
                        )}
                        <DetailItem
                          fullWidth
                          label={formatMessage({ id: 'Parent document' })}
                          value={
                            documentData.parent ? (
                              <TextLink
                                // primary, to read as one unit with the link it
                                // labels rather than as a separate black glyph
                                icon={
                                  <ParentTypeIcon
                                    fontSize="small"
                                    color="primary"
                                  />
                                }
                                value={documentData.parent.title}
                                url={`/ui/documents/${documentData.parent.id}`}
                              />
                            ) : null
                          }
                        />
                        <DetailItem
                          fullWidth
                          label={formatMessage({ id: 'Authors' })}
                          value={allAuthors}
                        />
                        <DetailItem
                          fullWidth
                          label={formatMessage({ id: 'Editor' })}
                          value={
                            documentData.editor ? (
                              <TextLink
                                icon={
                                  <CustomIcon type="organization" size={18} />
                                }
                                value={documentData.editor.name}
                                url={`/ui/organizations/${documentData.editor.id}`}
                              />
                            ) : null
                          }
                        />
                        <DetailItem
                          fullWidth
                          label={formatMessage({ id: 'Library' })}
                          value={
                            documentData.library ? (
                              <TextLink
                                icon={
                                  <CustomIcon type="organization" size={18} />
                                }
                                value={documentData.library.name}
                                url={`/ui/organizations/${documentData.library.id}`}
                              />
                            ) : null
                          }
                        />
                        <DetailItem
                          fullWidth
                          label={documentData.identifierType?.toUpperCase()}
                          value={documentData.identifier}
                          url={
                            documentData.identifierType === 'url'
                              ? documentData.identifier
                              : undefined
                          }
                        />
                        <DetailItem
                          fullWidth
                          label={formatMessage({
                            id: 'Publication (BBS legacy)'
                          })}
                          value={documentData?.oldBBS?.publicationOther}
                        />
                        <DetailItem
                          fullWidth
                          label={formatMessage({
                            id: 'Publication number (BBS legacy)'
                          })}
                          value={documentData?.oldBBS?.publicationFascicule}
                        />
                        <DetailItem
                          fullWidth
                          label={formatMessage({ id: 'Subjects' })}
                          value={
                            documentData.subjects?.length
                              ? documentData.subjects
                                  .map(
                                    s =>
                                      `${s.id} ${formatMessage({
                                        id: s.id,
                                        defaultMessage: s.subject
                                      })}`
                                  )
                                  .join(' · ')
                              : null
                          }
                        />
                        <DetailItem
                          fullWidth
                          // Not "Regions": the field is iso3166 and most often
                          // holds a country. "Regions" stays in use elsewhere for
                          // actual region lists.
                          label={formatMessage({ id: 'Geographic coverage' })}
                          value={
                            documentData.iso3166?.length
                              ? documentData.iso3166
                                  .map(e => `${e.name} (${e.iso})`)
                                  .join(' · ')
                              : null
                          }
                        />
                        {permissions.isModerator && (
                          <DetailItem
                            fullWidth
                            label={formatMessage({ id: 'Authorization' })}
                            value={
                              documentData.authorizationDocument?.title ? (
                                <TextLink
                                  icon={
                                    <AuthorizationIcon
                                      fontSize="small"
                                      color="primary"
                                    />
                                  }
                                  value={
                                    documentData.authorizationDocument.title
                                  }
                                  url={`/ui/documents/${documentData.authorizationDocument.id}`}
                                />
                              ) : null
                            }
                          />
                        )}
                        <DetailItem
                          fullWidth
                          label={formatMessage({ id: 'Source' })}
                          value={
                            documentData.importSource
                              ? `${documentData.importId}#${documentData.importSource}`
                              : null
                          }
                        />
                      </DetailsList>
                    </SideColumn>
                  </HalfSplitContainer>
                  <Box sx={{ mt: 0.5, mb: -1 }}>
                    <AuthorAndDate
                      author={documentData.creator}
                      textColor="textSecondary"
                      date={documentData.dateInscription}
                      verb="Created"
                    />
                  </Box>
                </>
              }
            />

            {linkedEntities.length > 0 && (
              <ScrollableContent
                dense
                title={formatMessage({ id: 'Linked entities' })}
                content={
                  <LinkedEntitiesList>{linkedEntities}</LinkedEntitiesList>
                }
              />
            )}

            {childArticles.length > 0 && (
              <ScrollableContent
                dense
                title={formatMessage({ id: 'Articles' })}
                count={childArticles.length}
                // In the card's own header row rather than a row added inside the
                // body: the card header and the content each carry their own
                // padding, so an extra row there opened a wide empty band under
                // the title.
                icon={
                  <ChildrenControls
                    documents={childArticles}
                    sortOrder={articlesSortOrder}
                    onSortOrderChange={setArticlesSortOrder}
                  />
                }
                content={
                  <DocumentChildrenList documents={sortedChildArticles} />
                }
              />
            )}

            {!isCollection(docType) && childIssues.length > 0 && (
              <ScrollableContent
                dense
                title={formatMessage({ id: 'Issues' })}
                count={childIssues.length}
                icon={
                  <ChildrenControls
                    documents={childIssues}
                    sortOrder={issuesSortOrder}
                    onSortOrderChange={setIssuesSortOrder}
                  />
                }
                content={<DocumentChildrenList documents={sortedChildIssues} />}
              />
            )}

            {childOther.length > 0 && (
              <ScrollableContent
                dense
                title={formatMessage({ id: 'Child documents' })}
                count={childOther.length}
                icon={
                  <ChildrenControls
                    documents={childOther}
                    sortOrder={otherSortOrder}
                    onSortOrderChange={setOtherSortOrder}
                  />
                }
                content={<DocumentChildrenList documents={sortedChildOther} />}
              />
            )}
          </>
        )}
      </SectionStack>
    </PageContainer>
  );
};

const DocumentDetails = ({ id, hideActions = false }) => {
  const permissions = usePermissions();
  const { documentId: documentIdFromRoute } = useParams();
  const documentId = parseInt(documentIdFromRoute ?? id, 10);
  const {
    data: details,
    isPending: isDetailsPending,
    isPaused: isDetailsPaused,
    error: detailsError,
    refetch: refetchDetails
  } = useDocument(documentId);
  const {
    data: children = [],
    isPending: isDocumentChildrenLoading,
    error: childrenError,
    refetch: refetchChildren
  } = useDocumentChildren(documentId);
  // The document body renders its language by name, so it must not appear
  // before the list is known. Calling useLanguages here as well as in <Document>
  // costs nothing: React Query dedupes the two into a single request.
  const { isPending: isLanguagesPending } = useLanguages();

  const fetchError = detailsError ?? childrenError;
  const onRetry = useCallback(() => {
    refetchDetails();
    refetchChildren();
  }, [refetchDetails, refetchChildren]);

  return details?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.document} entity={details} />
  ) : (
    <Document
      // Navigating between documents without leaving the page (breadcrumb, then
      // a sibling) keeps the component mounted: without the key, the three sort
      // selects and wantedDeletedState would carry over from the previous
      // document and act on the new one. Looks like an unusual key — don't
      // remove as "redundant" during refactoring, it is what forces the state
      // reset.
      key={documentId}
      isLoading={
        !documentId ||
        isDetailsPending ||
        isDocumentChildrenLoading ||
        isLanguagesPending
      }
      // Deliberately not exclusive: a children-fetch failure alongside a
      // successful detail fetch still renders the document content plus the
      // error card, as a degraded state rather than blanking the whole page.
      error={fetchError}
      isPaused={isDetailsPaused}
      onRetry={onRetry}
      documentData={details}
      documentChildren={children}
      hideActions={hideActions}
    />
  );
};

export default DocumentDetails;

Document.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.shape({}),
  isPaused: PropTypes.bool,
  onRetry: PropTypes.func,
  documentData: DocumentPropTypes,
  documentChildren: PropTypes.arrayOf(DocumentChildPropTypes),
  hideActions: PropTypes.bool
};

DocumentDetails.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hideActions: PropTypes.bool
};
