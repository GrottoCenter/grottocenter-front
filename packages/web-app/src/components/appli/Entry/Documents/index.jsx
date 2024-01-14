import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, Divider, Tooltip } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { useDispatch } from 'react-redux';

import CancelIcon from '@material-ui/icons/Cancel';
import styled from 'styled-components';
import { linkDocumentToEntrance } from '../../../../actions/LinkDocumentToEntrance';
import { unlinkDocumentToEntrance } from '../../../../actions/UnlinkDocumentToEntrance';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import SearchDocumentForm from '../../Form/SearchDocumentForm';
import Alert from '../../../common/Alert';
import { usePermissions } from '../../../../hooks';
import DocumentsList from '../../../common/DocumentsList/DocumentsList';

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
        linkDocumentToEntrance({
          entranceId,
          document: d
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

          <DocumentsList
            documents={documents}
            hasSnapshotButton
            emptyMessageComponent={
              <Alert
                severity="info"
                title={formatMessage({
                  id: 'There is currently no document for this entrance.'
                })}
              />
            }
            onUnlink={
              !permissions.isModerator
                ? false
                : async document => {
                    dispatch(
                      unlinkDocumentToEntrance({
                        entranceId,
                        documentId: document.id
                      })
                    );
                  }
            }
          />
        </>
      }
    />
  );
};

Documents.propTypes = {
  documents: DocumentsList.propTypes.documents,
  entranceId: PropTypes.number.isRequired
};

export default Documents;
