import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Chip, Skeleton } from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import ShareIcon from '@mui/icons-material/Share';
import CustomIcon from '../../components/common/CustomIcon';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Linkify from 'linkify-react';
import { loadLanguages } from '../../actions/Language';

import {
  FileListElement,
  ItemList,
  ItemString,
  ListElement,
  SectionDetails,
  SectionDivider,
  SectionFilesPreview,
  SectionList,
  SectionText,
  SectionTitleLink,
  TextLink
} from './Section';
import { fetchDocumentDetails } from '../../actions/Document/GetDocumentDetails';
import { fetchDocumentChildren } from '../../actions/Document/GetDocumentChildren';
import { deleteDocument } from '../../actions/Document/DeleteDocument';
import { restoreDocument } from '../../actions/Document/RestoreDocument';
import { usePermissions, useSharePage } from '../../hooks';
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
    if (!documentData) return [];
    const items = [
      ...(documentData.authors ?? []).map(a => ({
        id: a.id,
        name: a.nickname,
        url: `/ui/persons/${a.id}`
      })),
      ...(documentData.authorsOrganization ?? []).map(a => ({
        id: a.id,
        name: a.name,
        url: `/ui/organizations/${a.id}`
      }))
    ];
    return items.flatMap((a, i) =>
      i < items.length - 1
        ? [<TextLink key={a.id} value={a.name} url={a.url} />, ' - ']
        : [<TextLink key={a.id} value={a.name} url={a.url} />]
    );
  }, [documentData]);

  const allFiles = useMemo(() => {
    if (!documentData?.parent?.files?.length) return [];
    const file = documentData.parent.files[0];
    const pageRegex = /^(\d+)(?:-(\d+))?$/;
    return String(documentData.pages)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .flatMap(segment => {
        const match = segment.match(pageRegex);
        if (!match) return [];
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : null;
        const path = `${file.completePath}#page=${start}`;
        return [
          <FileListElement
            key={path}
            fileName={formatMessage(
              {
                id: end
                  ? 'Pages {start}-{end} of {title}'
                  : 'Page {start} of {title}'
              },
              { start, end, title: documentData.parent.title }
            )}
            filePath={path}
          />
        ];
      });
  }, [documentData, formatMessage]);

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
          key={e.id}
          icon={<CustomIcon type="massif" />}
          value={e.name}
          secondary={formatMessage({ id: 'Massif' })}
          url={`/ui/massifs/${e.id}`}
        />
      )),
      documentData.cave && (
        <ListElement
          key={documentData.cave.id}
          icon={<CustomIcon type="network" />}
          value={documentData.cave.name}
          secondary={formatMessage({ id: 'Cave' })}
          url={`/ui/caves/${documentData.cave.id}`}
        />
      ),
      ...(documentData.entrances ?? []).map(entrance => (
        <ListElement
          key={entrance.id}
          icon={<CustomIcon type="entrance" />}
          value={entrance.name}
          secondary={formatMessage({ id: 'Entrance' })}
          url={`/ui/entrances/${entrance.id}`}
        />
      ))
    ].filter(Boolean);
  }, [documentData, formatMessage]);

  const isActionLoading = wantedDeletedState !== documentData?.isDeleted;

  const snapshotUrl = documentData
    ? `/ui/documents/${documentData.id}/snapshots`
    : null;

  const subheader =
    !isLoading &&
    documentData &&
    permissions.isAuth &&
    !documentData?.isValidated
      ? formatMessage({
          id: 'A moderator needs to validate the last modification before being able to edit the document again.'
        })
      : null;

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
    <>
      <PageHeader
        title={documentData?.title ?? (isLoading ? undefined : '')}
        subheader={subheader}
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
        <ScrollableContent
          content={
            <>
              <SectionTitleLink
                title={formatMessage({ id: 'Is Part of' })}
                value={documentData.parent?.title}
                url={`/ui/documents/${documentData.parent?.id}`}
              />
              <SectionText title={formatMessage({ id: 'Summary' })}>
                <Linkify options={linkifyOptions}>
                  {documentData.description}
                </Linkify>
              </SectionText>
              <SectionDivider />
              <SectionDetails title={formatMessage({ id: 'Details' })}>
                <ItemString
                  label={formatMessage({ id: 'Type' })}
                  value={
                    <Chip
                      color="primary"
                      label={formatMessage({ id: documentData.type })}
                    />
                  }
                />
                <ItemString
                  label={formatMessage({ id: 'Language' })}
                  value={
                    languages.find(e => e.id === mainLanguage)?.refName ??
                    mainLanguage
                  }
                />
                <ItemString
                  label={documentData.identifierType?.toUpperCase()}
                  value={documentData.identifier}
                  url={
                    documentData.identifierType === 'url'
                      ? documentData.identifier
                      : undefined
                  }
                />
                <ItemList label={formatMessage({ id: 'Authors' })}>
                  {allAuthors}
                </ItemList>
                <ItemString
                  label={formatMessage({ id: 'Editor' })}
                  value={documentData.editor?.name}
                  url={`/ui/organizations/${documentData.editor?.id}`}
                />
                <ItemString
                  label={formatMessage({ id: 'Library' })}
                  value={documentData.library?.name}
                  url={`/ui/organizations/${documentData.library?.id}`}
                />
                <ItemString
                  label={formatMessage({ id: 'Publication date' })}
                  value={documentData.datePublication}
                />
                <ItemString
                  label={formatMessage({ id: 'Publication (BBS legacy)' })}
                  value={documentData?.oldBBS?.publicationOther}
                />
                <ItemString
                  label={formatMessage({
                    id: 'Publication number (BBS legacy)'
                  })}
                  value={documentData?.oldBBS?.publicationFascicule}
                />
                <ItemString
                  label={formatMessage({ id: 'Pages' })}
                  value={documentData.pages}
                />
                <ItemString
                  label={formatMessage({ id: 'Issue' })}
                  value={documentData.issue}
                />
                <ItemList label={formatMessage({ id: 'Subjects' })}>
                  {documentData.subjects?.map(
                    s =>
                      `${s.id} ${formatMessage({
                        id: s.id,
                        defaultMessage: s.subject
                      })}`
                  )}
                </ItemList>
                <ItemList label={formatMessage({ id: 'Regions' })}>
                  {documentData.iso3166?.map(e => `${e.name} (${e.iso})`)}
                </ItemList>
                {permissions.isModerator && (
                  <ItemString
                    label={formatMessage({ id: 'Authorization' })}
                    value={documentData?.authorizationDocument?.title}
                    url={`/ui/documents/${documentData.authorizationDocument?.id}`}
                  />
                )}
                <ItemString
                  label={formatMessage({ id: 'Source' })}
                  value={
                    documentData.importSource
                      ? `${documentData.importId}#${documentData.importSource}`
                      : null
                  }
                />
                <ItemString
                  label={formatMessage({ id: 'License' })}
                  value={documentData.license}
                />
              </SectionDetails>
              <SectionList title={formatMessage({ id: 'Linked entities' })}>
                {linkedEntities}
              </SectionList>
              {allFiles.length > 0 && (
                <SectionList title={formatMessage({ id: 'Files' })}>
                  {allFiles}
                </SectionList>
              )}
              <SectionList title={formatMessage({ id: 'Articles' })}>
                {childArticles?.map(doc => (
                  <ListElement
                    key={doc.id}
                    icon={<CustomIcon type="bibliography" />}
                    value={doc.title}
                    secondary={doc.description}
                    url={`/ui/documents/${doc.id}`}
                  />
                ))}
              </SectionList>
              <SectionList title={formatMessage({ id: 'Issues' })}>
                {childIssues?.map(doc => (
                  <ListElement
                    key={doc.id}
                    icon={<CustomIcon type="bibliography" />}
                    value={doc.title}
                    secondary={doc.description}
                    url={`/ui/documents/${doc.id}`}
                  />
                ))}
              </SectionList>
              <SectionList title={formatMessage({ id: 'Child documents' })}>
                {childOther?.map(doc => (
                  <ListElement
                    key={doc.id}
                    icon={<CustomIcon type="bibliography" />}
                    value={doc.title}
                    secondary={doc.description}
                    url={`/ui/documents/${doc.id}`}
                  />
                ))}
              </SectionList>
              <SectionFilesPreview
                title={formatMessage({ id: 'Files' })}
                files={documentData?.files}
              />
              <AuthorAndDate
                author={documentData.creator}
                textColor="textSecondary"
                date={documentData.dateInscription}
                verb="Created"
              />
            </>
          }
        />
      )}
    </>
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
