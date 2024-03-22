import React, { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { Chip } from '@material-ui/core';
import { Terrain } from '@material-ui/icons';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import { Skeleton } from '@material-ui/lab';

import getAuthor from '../../util/getAuthor';
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
import { fetchDocumentDetails } from '../../actions/DocumentDetails';
import { fetchDocumentChildren } from '../../actions/DocumentChildren';
import { usePermissions } from '../../hooks';
import FixedContent from '../../components/common/Layouts/Fixed/FixedContent';
import Deleted, {
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';
import AuthorAndDate from '../../components/common/Contribution/AuthorAndDate';

const DocumentPage = ({
  loading = true,
  documentId,
  documentData,
  documentChildren,
  onEdit
}) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();

  const isLoading = loading || !documentData || !documentChildren;

  const { languages, isLoaded: isLanguagesLoaded } = useSelector(
    state => state.language
  );

  useEffect(() => {
    if (!isLanguagesLoaded) {
      dispatch(loadLanguages(true));
    }
  }, [dispatch, isLanguagesLoaded]);

  const allAuthors = [];
  const childIssues = [];
  const childArticles = [];
  const childOther = [];
  const linkedEntities = [];

  if (!loading) {
    // eslint-disable-next-line no-param-reassign
    if (documentData.mainLanguage === '000') documentData.mainLanguage = null;

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

  return (
    <FixedContent
      onEdit={documentData.isValidated ? onEdit : undefined}
      subheader={
        !isLoading &&
        !documentData.isValidated &&
        formatMessage({
          id: 'A moderator needs to validate the last modification before being able to edit the document again.'
        })
      }
      snapshot={{
        id: documentId,
        entity: 'documents',
        actualVersion: documentData
      }}
      title={documentData.title}
      content={
        isLoading ? (
          <>
            <Skeleton width={75} />
            <Skeleton />
            <Skeleton width={100} />
            <Skeleton variant="rect" height={150} />
            <Skeleton width={125} />
            <Skeleton variant="rect" height={80} />
          </>
        ) : (
          <>
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
                label={formatMessage({ id: 'Publication number (BBS legacy)' })}
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
              author={getAuthor(documentData.creator)}
              textColor="textSecondary"
              date={documentData.dateInscription}
              verb="Created"
            />
          </>
        )
      }
    />
  );
};

const HydratedDocumentPage = ({ id }) => {
  const dispatch = useDispatch();
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

  const history = useHistory();
  const editPath = useRef('/ui');
  const permissions = usePermissions();

  useEffect(() => {
    if (!isNil(documentId)) {
      dispatch(fetchDocumentDetails(documentId));
      dispatch(fetchDocumentChildren(documentId, locale));
      editPath.current = `/ui/documents/${documentId}/edit`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const onEdit = () => {
    history.push(editPath.current);
  };

  return details.isDeleted ? (
    <Deleted
      redirectTo={details.redirectTo}
      entity={DELETED_ENTITIES.document}
      name=""
      creationDate={details.dateInscription}
      dateReviewed={details.dateReviewed}
      author={details.author}
      reviewer={details.reviewer}
    />
  ) : (
    <DocumentPage
      documentId={documentId}
      documentData={details}
      documentChildren={children}
      loading={
        isNil(documentId) ||
        isLoading ||
        isDocumentChildrenLoading ||
        !isNil(error) ||
        !isNil(childrenError)
      }
      isValidated={details.modifiedDocJson === null}
      onEdit={permissions.isAuth ? onEdit : undefined}
    />
  );
};

export default HydratedDocumentPage;

const simpleCaver = PropTypes.shape({
  id: PropTypes.number.isRequired,
  nickname: PropTypes.string.isRequired
});
const simpleOrganization = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired
});
const simpleSubject = PropTypes.shape({
  id: PropTypes.number.isRequired,
  subject: PropTypes.string.isRequired
});
const simpleLinkedEntity = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired
});
const simpleDocument = PropTypes.shape({
  id: PropTypes.number.isRequired,
  title: PropTypes.string,
  description: PropTypes.string
});
const fullDocument = PropTypes.shape({
  id: PropTypes.number,
  importSource: PropTypes.string,
  importId: PropTypes.number,
  type: PropTypes.string,
  isValidated: PropTypes.bool,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  dateValidation: PropTypes.string,
  datePublication: PropTypes.string,
  creator: simpleCaver,
  authors: PropTypes.arrayOf(simpleCaver),
  authorsOrganization: PropTypes.arrayOf(simpleOrganization),
  reviewer: simpleCaver,
  validator: simpleCaver,
  title: PropTypes.string,
  description: PropTypes.string,
  mainLanguage: PropTypes.string,
  identifier: PropTypes.string,
  identifierType: PropTypes.string,
  library: simpleOrganization,
  editor: simpleOrganization,
  subjects: PropTypes.arrayOf(simpleSubject),
  issue: PropTypes.string,
  pages: PropTypes.string,
  license: PropTypes.string,
  iso3166: PropTypes.arrayOf(PropTypes.string),
  authorizationDocument: PropTypes.string,
  cave: simpleLinkedEntity,
  entrance: simpleLinkedEntity,
  massifs: PropTypes.arrayOf(simpleLinkedEntity),
  parent: simpleDocument,
  oldBBS: PropTypes.shape({
    publicationOther: PropTypes.string,
    publicationFascicule: PropTypes.string
  }),
  files: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string,
      completePath: PropTypes.string
    })
  )
});
const deletedDocument = PropTypes.shape({
  id: PropTypes.number,
  isDeleted: PropTypes.number,
  redirectTo: PropTypes.number,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  author: simpleCaver,
  reviewer: simpleCaver
});

DocumentPage.propTypes = {
  loading: PropTypes.bool,
  documentId: PropTypes.number,
  documentData: PropTypes.oneOfType([
    PropTypes.shape({}),
    fullDocument,
    deletedDocument
  ]),
  documentChildren: PropTypes.arrayOf(simpleDocument),
  onEdit: PropTypes.func
};

HydratedDocumentPage.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
