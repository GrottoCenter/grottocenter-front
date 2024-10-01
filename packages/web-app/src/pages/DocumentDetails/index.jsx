import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Chip, Skeleton } from '@mui/material';
import { Terrain } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';

import { loadLanguages } from '../../actions/Language';

import {
  SectionDivider,
  SectionText,
  SectionDetails,
  SectionList,
  SectionTitleLink,
  SectionFilesPreview,
  ItemString,
  ItemList,
  ListElement,
  TextLink
} from './Section';
import CustomIcon from '../../components/common/CustomIcon';
import { fetchDocumentDetails } from '../../actions/Document/GetDocumentDetails';
import { fetchDocumentChildren } from '../../actions/Document/GetDocumentChildren';
import { deleteDocument } from '../../actions/Document/DeleteDocument';
import { restoreDocument } from '../../actions/Document/RestoreDocument';
import { usePermissions } from '../../hooks';
import FixedContent from '../../components/common/Layouts/Fixed/FixedContent';
import Alert from '../../components/common/Alert';
import {
  Deleted,
  DeletedCard,
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';
import AuthorAndDate from '../../components/common/Contribution/AuthorAndDate';
import {
  DocumentPropTypes,
  DocumentSimplePropTypes
} from '../../types/document.type';

const Document = ({
  isLoading = true,
  error,
  documentData,
  documentChildren
}) => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const { languages } = useSelector(state => state.language);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    if (documentData) setWantedDeletedState(documentData.isDeleted);
  }, [documentData]);

  let onEdit = null;
  let onDelete = null;
  if (permissions.isAuth && !documentData?.isDeleted) {
    if (documentData?.isValidated) {
      onEdit = () => {
        history.push(`/ui/documents/${documentData.id}/edit`);
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
    if (isPermanent) history.replace('/');
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreDocument({ id: documentData.id }));
  };

  const allAuthors = [];
  const childIssues = [];
  const childArticles = [];
  const childOther = [];
  const linkedEntities = [];

  if (!isLoading) {
    // eslint-disable-next-line no-param-reassign
    if (documentData?.mainLanguage === '000') documentData.mainLanguage = null;

    for (const author of documentData?.authors ?? []) {
      allAuthors.push(
        <TextLink
          key={author.id}
          value={author.nickname}
          url={`/ui/persons/${author.id}`}
        />,
        ' - '
      );
    }
    for (const author of documentData?.authorsOrganization ?? []) {
      allAuthors.push(
        <TextLink
          key={author.id}
          value={author.name}
          url={`/ui/organizations/${author.id}`}
        />,
        ' - '
      );
    }
    if (allAuthors.length > 0) allAuthors.splice(allAuthors.length - 1);

    for (const doc of documentChildren) {
      if (doc.type === 'Issue') childIssues.push(doc);
      else if (doc.type === 'Article') childArticles.push(doc);
      else childOther.push(doc);
    }

    if (documentData?.massifs && documentData?.massifs.length > 0)
      linkedEntities.push(
        ...(documentData?.massifs?.map(e => (
          <ListElement
            key={e.id}
            icon={<Terrain fontSize="large" color="primary" />}
            value={e.name}
            secondary={formatMessage({ id: 'Massif' })}
            url={`/ui/massifs/${e.id}`}
          />
        )) ?? [])
      );
    if (documentData?.cave)
      linkedEntities.push(
        <ListElement
          key={documentData?.cave.id}
          icon={<CustomIcon type="cave_system" />}
          value={documentData?.cave.name}
          secondary={formatMessage({ id: 'Cave' })}
          url={`/ui/caves/${documentData?.cave.id}`}
        />
      );
    if (documentData?.entrance)
      linkedEntities.push(
        <ListElement
          key={documentData?.entrance.id}
          icon={<CustomIcon type="entry" />}
          value={documentData?.entrance.name}
          secondary={formatMessage({ id: 'Entrance' })}
          url={`/ui/entrances/${documentData?.entrance.id}`}
        />
      );
  }

  const isActionLoading = wantedDeletedState !== documentData?.isDeleted;

  return (
    <FixedContent
      onEdit={!error ? onEdit : null}
      onDelete={!error ? onDelete : null}
      subheader={
        !isLoading &&
        documentData &&
        permissions.isAuth &&
        !documentData?.isValidated &&
        formatMessage({
          id: 'A moderator needs to validate the last modification before being able to edit the document again.'
        })
      }
      snapshot={
        !!documentData && {
          id: documentData.id,
          type: 'documents',
          content: documentData
        }
      }
      title={documentData?.title ?? ''}
      content={
        <>
          {isLoading && (
            <>
              <Skeleton width={75} />
              <Skeleton />
              <Skeleton width={100} />
              <Skeleton variant="rectangular" height={150} />
              <Skeleton width={125} />
              <Skeleton variant="rectangular" height={80} />
            </>
          )}
          {error && (
            <Alert
              title={formatMessage({
                id: 'Error, the document data you are looking for is not available.'
              })}
              severity="error"
            />
          )}
          {documentData && (
            <>
              {documentData.isDeleted && (
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

              <SectionTitleLink
                title={formatMessage({ id: 'Is Part of' })}
                value={documentData.parent?.title}
                url={`/ui/documents/${documentData.parent?.id}`}
              />
              <SectionText title={formatMessage({ id: 'Summary' })}>
                {documentData.description}
              </SectionText>
              <SectionDivider />
              <SectionDetails title={formatMessage({ id: 'Details' })}>
                <ItemString
                  label={formatMessage({ id: 'Type' })}
                  value={<Chip color="primary" label={documentData.type} />}
                />
                <ItemString
                  label={formatMessage({ id: 'Language' })}
                  value={
                    languages.find(e => e.id === documentData.mainLanguage)
                      ?.refName ?? documentData.mainLanguage
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
          )}
        </>
      }
    />
  );
};

const DocumentDetails = ({ id }) => {
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
    />
  );
};

export default DocumentDetails;

Document.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.shape({}),
  documentData: DocumentPropTypes,
  documentChildren: PropTypes.arrayOf(DocumentSimplePropTypes)
};

DocumentDetails.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
