import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, Divider, List, Tooltip } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { useDispatch } from 'react-redux';

import CancelIcon from '@material-ui/icons/Cancel';
import styled from 'styled-components';
import { associateDocumentToEntrance } from '../../../../actions/AssociateDocumentToEntrance';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import SearchDocumentForm from '../../Form/SearchDocumentForm';
import Alert from '../../../common/Alert';
import { usePermissions } from '../../../../hooks';
import { documentsType } from '../Provider';
import Document from './Document';

const DividerStyled = styled(Divider)`
  background-color: ${props => props.theme.palette.divider};
`;
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
          <Tooltip
            title={
              isDocumentSearchVisible
                ? formatMessage({ id: 'Cancel this search' })
                : formatMessage({ id: 'Assign an existing document' })
            }>
            <Button
              color={isDocumentSearchVisible ? '' : 'secondary'}
              variant="outlined"
              onClick={() =>
                setIsDocumentSearchVisible(!isDocumentSearchVisible)
              }
              startIcon={
                isDocumentSearchVisible ? <CancelIcon /> : <AddCircleIcon />
              }>
              {formatMessage({
                id: isDocumentSearchVisible ? 'Cancel' : 'Add'
              })}
            </Button>
          </Tooltip>
        )
      }
      content={
        <>
          {isDocumentSearchVisible && (
            <>
              <SearchDocumentForm onSubmit={onSubmitForm} />
              <DividerStyled />
            </>
          )}

          {documents.length > 0 ? (
            <List>
              {documents.map(document => (
                <span key={document.id}>
                  <DividerStyled variant="middle" component="li" />
                  <Document {...document} />
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
