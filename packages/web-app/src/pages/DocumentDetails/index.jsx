import React, { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { Terrain } from '@material-ui/icons';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import { Divider, Link } from '@material-ui/core';

import AttachFileIcon from '@material-ui/icons/AttachFile';
import DescriptionIcon from '@material-ui/icons/Description';
import styled from 'styled-components';
import Overview from './Overview';
import Section from './Section';
import CustomIcon from '../../components/common/CustomIcon';
import { fetchDocumentDetails } from '../../actions/DocumentDetails';
import { fetchDocumentChildren } from '../../actions/DocumentChildren';
import {
  makeDetails,
  makeDocumentChildren,
  makeEntities,
  makeOrganizations,
  makeOverview,
  makeDocumentParent,
  makeIdentifier
} from './transformers';
import { usePermissions } from '../../hooks';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';

const OrganizationIcon = styled.img`
  height: 35px;
  width: 35px;
`;

const StyledDivider = styled(Divider)`
  margin-top: ${({ theme }) => theme.spacing(4)}px;
  margin-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const DocumentPage = ({
  loading = true,
  overview,
  organizations,
  details,
  entities,
  documentChildren,
  documentParent,
  isValidated,
  onEdit,
  areDocumentChildrenLoading,
  identifier
}) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();

  return (
    <Layout
      onEdit={isValidated ? onEdit : undefined}
      subheader={
        !isValidated &&
        formatMessage({
          id:
            'A moderator needs to validate the last modification before being able to edit the document again.'
        })
      }
      title={
        overview.title ||
        (loading ? formatMessage({ id: 'Loading document data...' }) : '')
      }
      content={
        <>
          <Overview {...overview} loading={loading} />
          <StyledDivider />
          <Section
            loading={loading}
            title={formatMessage({ id: 'Organizations' })}
            content={[
              {
                Icon: () => (
                  <OrganizationIcon
                    src="/images/club.svg"
                    alt="Organization icon"
                  />
                ),
                label: formatMessage({ id: 'Editor' }),
                value: organizations?.editor.name,
                url: `/ui/organizations/${organizations?.editor.id}`,
                internalUrl: true
              },
              {
                Icon: () => (
                  <OrganizationIcon
                    src="/images/club.svg"
                    alt="Organization icon"
                  />
                ),
                label: formatMessage({ id: 'Library' }),
                value: organizations?.library.name,
                url: `/ui/organizations/${organizations?.library.id}`,
                internalUrl: true
              }
            ]}
          />
          <StyledDivider />
          <Section
            loading={loading}
            title={formatMessage({ id: 'Details' })}
            content={[
              {
                label: formatMessage({ id: 'Identifier' }),
                value: details.identifier,
                url: identifier
              },
              {
                label: formatMessage({ id: 'BBS reference' }),
                value: details.bbsReference
              },
              {
                label: formatMessage({ id: 'Document type' }),
                value:
                  details.documentType &&
                  formatMessage({ id: details.documentType })
              },
              {
                label: formatMessage({ id: 'Publication date' }),
                value: details.publicationDate
              },
              {
                label: formatMessage({ id: 'Publication (BBS legacy)' }),
                value: details.oldPublication
              },
              {
                label: formatMessage({ id: 'Publication number (BBS legacy)' }),
                value: details.oldPublicationFascicule
              },
              {
                label: formatMessage({ id: 'Parent document' }),
                value: documentParent.title,
                url: documentParent.url
              },
              {
                label: formatMessage({ id: 'Pages' }),
                value: details.pages
              },
              {
                label: formatMessage({ id: 'Subjects' }),
                value: details.subjects.map(s =>
                  formatMessage({
                    id: s.code,
                    defaultMessage: s.subject
                  })
                ),
                type: 'list'
              },
              {
                label: formatMessage({ id: 'Regions' }),
                value: details.regions.map(r =>
                  formatMessage({
                    id: r.code,
                    defaultMessage: r.name
                  })
                ),
                type: 'list'
              },
              {
                label: formatMessage({ id: 'Author comment' }),
                value: details.authorComment
              }
            ]}
          />
          <StyledDivider />
          <Section
            loading={loading}
            title={formatMessage({ id: 'Linked Entities' })}
            content={[
              {
                Icon: () => <Terrain fontSize="large" color="primary" />,
                label: formatMessage({ id: 'Massif' }),
                value: entities.massif?.name,
                url: `/ui/massifs/${entities.massif?.id}`
              },
              {
                Icon: () => <CustomIcon type="entry" />,
                internalUrl: true,
                label: formatMessage({ id: 'Entrance' }),
                value: entities.entrance?.name,
                url: `/ui/entrances/${entities.entrance?.id}`
              },
              {
                Icon: () => <CustomIcon type="cave_system" />,
                label: formatMessage({ id: 'Cave' }),
                value: entities.cave?.name,
                url: `/ui/caves/${entities.cave?.id}`
              },
              {
                Icon: () => <DescriptionIcon color="primary" />,
                type: 'list',
                label: formatMessage({ id: 'Files' }),
                value: entities.files.fileNames,
                CustomComponent: Link,
                CustomComponentProps: entities.files.fileLinks
              },
              permissions.isModerator && {
                Icon: () => <AttachFileIcon color="primary" />,
                label: formatMessage({ id: 'Authorization document' }),
                value: entities.authorizationDocument
              },
              {
                Icon: () => <CustomIcon type="bibliography" />,
                label: formatMessage({ id: 'Child documents' }),
                value: documentChildren,
                type: 'tree',
                isLabelAndIconOnTop: true,
                isLoading: areDocumentChildrenLoading
              }
            ]}
          />
        </>
      }
    />
  );
};

const HydratedDocumentPage = ({ id }) => {
  const { documentId: documentIdFromRoute } = useParams();
  const documentId = documentIdFromRoute || id;
  const dispatch = useDispatch();
  const { isLoading, details, error } = useSelector(
    state => state.documentDetails
  );
  const {
    isLoading: areDocumentChildrenLoading,
    children,
    childrenError
  } = useSelector(state => state.documentChildren);
  const history = useHistory();
  const editPath = useRef('/ui');
  const permissions = usePermissions();
  const { locale } = useSelector(state => state.intl);

  useEffect(() => {
    if (!isNil(documentId)) {
      dispatch(fetchDocumentDetails(documentId));
      dispatch(fetchDocumentChildren(documentId));
      editPath.current = `/ui/documents/edit/${documentId}`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const onEdit = () => {
    history.push(editPath.current);
  };

  return (
    <DocumentPage
      overview={makeOverview(details || {})}
      organizations={makeOrganizations(details || {})}
      details={makeDetails(details || {})}
      entities={makeEntities(details || {})}
      documentChildren={makeDocumentChildren(children || {}, locale)}
      documentParent={makeDocumentParent(details || {})}
      areDocumentChildrenLoading={areDocumentChildrenLoading}
      loading={
        isNil(documentId) || isLoading || !isNil(error) || !isNil(childrenError)
      }
      isValidated={details.modifiedDocJson === null}
      onEdit={permissions.isAuth ? onEdit : undefined}
      identifier={makeIdentifier(details || {})}
    />
  );
};

export default HydratedDocumentPage;

DocumentPage.propTypes = {
  loading: PropTypes.bool,
  areDocumentChildrenLoading: PropTypes.bool,
  identifier: PropTypes.string,
  overview: PropTypes.shape({
    author: {
      id: PropTypes.number,
      nickname: PropTypes.string,
      url: PropTypes.string
    },
    authors: PropTypes.arrayOf(PropTypes.string).isRequired,
    language: PropTypes.string.isRequired,
    license: PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired
    }),
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired
  }),
  organizations: PropTypes.shape({
    editor: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    }),
    library: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    })
  }),
  details: PropTypes.shape({
    authorComment: PropTypes.string,
    identifier: PropTypes.string,
    bbsReference: PropTypes.string,
    documentType: PropTypes.string,
    oldPublication: PropTypes.string,
    oldPublicationFascicule: PropTypes.string,
    publicationDate: PropTypes.string,
    parentDocument: PropTypes.string,
    pages: PropTypes.string,
    subjects: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string,
        subject: PropTypes.string
      })
    ),
    regions: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string,
        name: PropTypes.string
      })
    )
  }),
  entities: PropTypes.shape({
    cave: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    }),
    entrance: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    }),
    massif: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    }),
    files: PropTypes.shape({
      fileNames: PropTypes.arrayOf(PropTypes.string),
      fileLinks: PropTypes.arrayOf(PropTypes.string)
    }),
    authorizationDocument: PropTypes.string
  }),
  documentChildren: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      url: PropTypes.string,
      childrenData: PropTypes.arrayOf(PropTypes.shape({})) // recursive data
    })
  ),
  documentParent: PropTypes.shape({
    title: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  }),
  isValidated: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired
};

HydratedDocumentPage.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
