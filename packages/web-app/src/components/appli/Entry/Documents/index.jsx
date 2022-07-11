import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Divider, IconButton, List } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import { useDispatch } from 'react-redux';

import { associateDocumentToEntrance } from '../../../../actions/AssociateDocumentToEntrance';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import SearchDocumentForm from '../../Form/SearchDocumentForm';
import Alert from '../../../common/Alert';
import { usePermissions } from '../../../../hooks';
import { documentsType } from '../Provider';
import Document from './Document';

const Documents = ({ documents, entranceId }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isDocumentSearchVisible, setIsDocumentSearchVisible] = useState(false);
  const dispatch = useDispatch();

  const onSubmitForm = newDocuments => {
    newDocuments.forEach(d => {
      dispatch(
        associateDocumentToEntrance({
          entranceId,
          documentId: d.id
        })
      );
    });
    setIsDocumentSearchVisible(false);
  };

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Documents' })}
      icon={
        permissions.isAuth && (
          <IconButton
            color="primary"
            onClick={() =>
              setIsDocumentSearchVisible(!isDocumentSearchVisible)
            }>
            {isDocumentSearchVisible ? <RemoveCircleIcon /> : <AddCircleIcon />}
          </IconButton>
        )
      }
      content={
        <>
          {isDocumentSearchVisible && (
            <>
              <SearchDocumentForm onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          {documents.length > 0 ? (
            <List>
              {documents.map((document, i) => (
                <span key={document.id}>
                  <Document {...document} />
                  {i < documents.length - 1 && (
                    <Divider variant="middle" component="li" />
                  )}
                </span>
              ))}
            </List>
          ) : (
            <Alert
              severity="info"
              content={formatMessage({
                id: 'There is currently no document for this entrance.'
              })}
            />
          )}
        </>
      }
    />
  );
};

Documents.propTypes = {
  documents: documentsType,
  entranceId: PropTypes.number.isRequired
};

export default Documents;
