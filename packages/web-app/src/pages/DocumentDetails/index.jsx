import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Box, Breadcrumbs, Chip, Link, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Linkify from 'linkify-react';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ShareIcon from '@mui/icons-material/Share';
import { NavigateNext } from '@mui/icons-material';

import CustomIcon from '../../components/common/CustomIcon';
import DocumentTypeChip from '../../components/common/DocumentTypeChip';
import {
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_FALLBACK_ICON,
  documentTypeHelpers
} from '../../utils/documentTypeHelpers';
import {
  DetailItem,
  DetailsList,
  EmptySection,
  EntitiesList,
  EventDateSection,
  FilesSection,
  ListElement,
  SummaryText,
  TextLink
} from './Section';
import { fetchDocumentDetails } from '../../actions/Document/GetDocumentDetails';
import { fetchDocumentChildren } from '../../actions/Document/GetDocumentChildren';
import { deleteDocument } from '../../actions/Document/DeleteDocument';
import { restoreDocument } from '../../actions/Document/RestoreDocument';
import { loadLanguages } from '../../actions/Language';
import { usePermissions, useSharePage } from '../../hooks';
import PageContainer from '../../components/common/Layouts/PageContainer';
import PageHeader from '../../components/common/Layouts/PageHeader';
import ResponsiveActions from '../../components/common/Layouts/ResponsiveActions';
import ScrollableContent from '../../components/common/Layouts/Fixed/ScrollableContent';
import Alert from '../../components/common/Alert';
import {
  DeleteConfirmationDialog,
  Deleted,
  DELETED_ENTITIES,
  DeletedCard
} from '../../components/common/card/Deleted';
import AuthorAndDate from '../../components/common/Contribution/AuthorAndDate';
import {
  DocumentPropTypes,
  DocumentSimplePropTypes
} from '../../types/document.type';
import linkifyOptions from '../../helpers/linkifyOptions';

const HalfSplitContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    flex-direction: row;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing(3)};
  }
`;

const MainColumn = styled('div')`
  flex: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SideColumn = styled('div')`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Document = ({
  isLoading = true,
  error,
  documentData,
  documentChildren,
  hideActions = false
}) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const { languages } = useSelector(state => state.language);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);
  const handleShare = useSharePage();

  useEffect(() => {
    if (documentData) setWantedDeletedState(documentData.isDeleted);
  }, [documentData]);

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
    dispatch(deleteDocument({ id: documentData.id, entityId, isPermanent }));
    if (isPermanent) navigate('/', { replace: true });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreDocument({ id: documentData.id }));
  };

  const mainLanguage =
    documentData?.mainLanguage === '000' ? null : documentData?.mainLanguage;

  const allAuthors = useMemo(() => {
    if (!documentData) return null;
    const items = [
      ...(documentData.authors ?? []).map(a => ({
        id: `caver-${a.id}`,
        name: a.nickname,
        url: `/ui/persons/${a.id}`
      })),
      ...(documentData.authorsOrganization ?? []).map(a => ({
        id: `org-${a.id}`,
        name: a.name,
        url: `/ui/organizations/${a.id}`
      }))
    ];
    if (items.length === 0) return null;
    return items.flatMap((a, i) =>
      i < items.length - 1
        ? [<TextLink key={a.id} value={a.name} url={a.url} />, ' · ']
        : [<TextLink key={a.id} value={a.name} url={a.url} />]
    );
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
  const childArticles = useMemo(
    () => (documentChildren ?? []).filter(d => d.type === 'Article'),
    [documentChildren]
  );
  const childOther = useMemo(
    () =>
      (documentChildren ?? []).filter(
        d => d.type !== 'Issue' && d.type !== 'Article'
      ),
    [documentChildren]
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
    <Breadcrumbs
      separator={<NavigateNext sx={{ fontSize: '1.2rem' }} />}
      sx={{
        fontSize: { xs: '1.2rem', md: '1.7rem' },
        '& .MuiBreadcrumbs-separator': { mx: { xs: '2px', md: '8px' } }
      }}>
      <Link
        component={RouterLink}
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
      </Link>
    </Breadcrumbs>
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
          key: 'delete',
          icon: <DeleteIcon />,
          label: formatMessage({ id: 'Delete' }),
          onClick: onDelete,
          hidden: !onDelete
        },
        {
          key: 'snapshot',
          icon: <ManageHistoryIcon />,
          label: formatMessage({ id: 'Page history' }),
          href: snapshotUrl,
          target: '_blank',
          hidden: !snapshotUrl
        }
      ]}
    />
  );

  return (
    <PageContainer>
      <PageHeader
        title={documentData?.title ?? (isLoading ? undefined : '')}
        icon={<CustomIcon type="bibliography" />}
        subheader={breadcrumb}
        actions={actions}
      />

      {documentData?.isDeleted && (
        <ScrollableContent
          content={
            <DeletedCard
              entityType={DELETED_ENTITIES.document}
              entity={documentData}
              isLoading={isActionLoading}
              onRestorePress={onRestorePress}
              onPermanentDeletePress={() => {
                setIsDeleteConfirmationPermanent(true);
                setIsDeleteConfirmationOpen(true);
              }}
            />
          }
        />
      )}

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

      {error && (
        <ScrollableContent
          content={
            <Alert
              title={formatMessage({
                id: 'Error, the document data you are looking for is not available.'
              })}
              severity="error"
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
                    <SummaryText>
                      <Linkify options={linkifyOptions}>
                        {documentData.description}
                      </Linkify>
                    </SummaryText>
                    {isCollection(docType) ? (
                      <Box>
                        <Typography variant="h5" gutterBottom>
                          {formatMessage({ id: 'Issues' })}
                          <Chip
                            label={childIssues.length}
                            size="small"
                            sx={{ ml: 1, fontWeight: 600, verticalAlign: 'middle' }}
                          />
                        </Typography>
                        {childIssues.length > 0 ? (
                          <EntitiesList>
                            {childIssues.map(doc => (
                              <ListElement
                                key={doc.id}
                                icon={<CustomIcon type="bibliography" />}
                                value={doc.title}
                                secondary={doc.description}
                                url={`/ui/documents/${doc.id}`}
                              />
                            ))}
                          </EntitiesList>
                        ) : (
                          <EmptySection
                            icon={
                              <NewspaperIcon fontSize="large" color="disabled" />
                            }
                            message={formatMessage({
                              id: 'No issues in this collection.'
                            })}
                          />
                        )}
                      </Box>
                    ) : isEvent(docType) ? (
                      <EventDateSection date={documentData.datePublication} />
                    ) : (
                      <FilesSection files={allFiles} />
                    )}
                  </MainColumn>
                  <SideColumn>
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
                          languages.find(e => e.id === mainLanguage)?.refName ??
                          mainLanguage
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
                      <DetailItem
                        label={formatMessage({ id: 'License' })}
                        value={documentData.license}
                      />
                      <DetailItem
                        fullWidth
                        label={formatMessage({ id: 'Parent document' })}
                        value={documentData.parent?.title}
                        url={
                          documentData.parent
                            ? `/ui/documents/${documentData.parent.id}`
                            : undefined
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
                        value={documentData.editor?.name}
                        url={
                          documentData.editor
                            ? `/ui/organizations/${documentData.editor.id}`
                            : undefined
                        }
                      />
                      <DetailItem
                        fullWidth
                        label={formatMessage({ id: 'Library' })}
                        value={documentData.library?.name}
                        url={
                          documentData.library
                            ? `/ui/organizations/${documentData.library.id}`
                            : undefined
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
                        label={formatMessage({ id: 'Regions' })}
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
                          value={documentData?.authorizationDocument?.title}
                          url={
                            documentData?.authorizationDocument
                              ? `/ui/documents/${documentData.authorizationDocument.id}`
                              : undefined
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
                <Box sx={{ mt: 1, mb: -2 }}>
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
              content={<EntitiesList>{linkedEntities}</EntitiesList>}
            />
          )}

          {childArticles.length > 0 && (
            <ScrollableContent
              dense
              title={formatMessage({ id: 'Articles' })}
              count={childArticles.length}
              content={
                <EntitiesList>
                  {childArticles.map(doc => (
                    <ListElement
                      key={doc.id}
                      icon={<CustomIcon type="bibliography" />}
                      value={doc.title}
                      secondary={doc.description}
                      url={`/ui/documents/${doc.id}`}
                    />
                  ))}
                </EntitiesList>
              }
            />
          )}

          {!isCollection(docType) && childIssues.length > 0 && (
            <ScrollableContent
              dense
              title={formatMessage({ id: 'Issues' })}
              count={childIssues.length}
              content={
                <EntitiesList>
                  {childIssues.map(doc => (
                    <ListElement
                      key={doc.id}
                      icon={<CustomIcon type="bibliography" />}
                      value={doc.title}
                      secondary={doc.description}
                      url={`/ui/documents/${doc.id}`}
                    />
                  ))}
                </EntitiesList>
              }
            />
          )}

          {childOther.length > 0 && (
            <ScrollableContent
              dense
              title={formatMessage({ id: 'Child documents' })}
              count={childOther.length}
              content={
                <EntitiesList>
                  {childOther.map(doc => (
                    <ListElement
                      key={doc.id}
                      icon={<CustomIcon type="bibliography" />}
                      value={doc.title}
                      secondary={doc.description}
                      url={`/ui/documents/${doc.id}`}
                    />
                  ))}
                </EntitiesList>
              }
            />
          )}
        </>
      )}
    </PageContainer>
  );
};

const DocumentDetails = ({ id, hideActions = false }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { locale } = useSelector(state => state.intl);
  const { documentId: documentIdFromRoute } = useParams();
  const documentId = parseInt(documentIdFromRoute ?? id, 10);
  const { isLoading, details, error } = useSelector(
    state => state.documentDetails
  );
  const {
    isLoading: isDocumentChildrenLoading,
    children,
    childrenError
  } = useSelector(state => state.documentChildren);

  const { isLoaded: isLanguagesLoaded } = useSelector(state => state.language);

  useEffect(() => {
    if (!isLanguagesLoaded) {
      dispatch(loadLanguages(true));
    }
  }, [dispatch, isLanguagesLoaded]);

  useEffect(() => {
    if (documentId) {
      dispatch(fetchDocumentDetails(documentId));
      dispatch(fetchDocumentChildren(documentId, locale));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  return details?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.document} entity={details} />
  ) : (
    <Document
      isLoading={
        !documentId ||
        isLoading ||
        isDocumentChildrenLoading ||
        !isLanguagesLoaded
      }
      error={error ?? childrenError}
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
  documentData: DocumentPropTypes,
  documentChildren: PropTypes.arrayOf(DocumentSimplePropTypes),
  hideActions: PropTypes.bool
};

DocumentDetails.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hideActions: PropTypes.bool
};
