import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, Divider, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useDispatch } from 'react-redux';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';
import { linkDocumentToMassif } from '../../../actions/LinkDocumentToMassif';
import { unlinkDocumentToMassif } from '../../../actions/UnlinkDocumentToMassif';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import SearchDocumentForm from '../SearchDocumentForm';
import Alert from '../../common/Alert';
import { usePermissions } from '../../../hooks';
import DocumentsList from '../../common/DocumentsList/DocumentsList';

const DividerStyled = styled(Divider)`
  background-color: ${props => props.theme.palette.divider};
`;

const Documents = ({ documents, massifId }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isDocumentSearchVisible, setIsDocumentSearchVisible] = useState(false);
  const dispatch = useDispatch();

  const onSubmitForm = newDocuments => {
    newDocuments.forEach(d => {
      dispatch(linkDocumentToMassif({ massifId, document: d }));
    });
    setIsDocumentSearchVisible(false);
  };

  return (
    <ScrollableContent
      dense
      anchorId="documents"
      title={formatMessage({ id: 'Documents' })}
      icon={
        permissions.isAuth && (
          <Tooltip
            title={formatMessage({
              id: isDocumentSearchVisible
                ? 'Cancel this search'
                : 'Assign an existing document'
            })}>
            <Button
              color={isDocumentSearchVisible ? 'inherit' : 'secondary'}
              variant="outlined"
              onClick={() => setIsDocumentSearchVisible(v => !v)}
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
                  id: 'There is currently no document for this massif.'
                })}
              />
            }
            onUnlink={
              !permissions.isModerator
                ? false
                : async document => {
                    dispatch(
                      unlinkDocumentToMassif({
                        massifId,
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
  massifId: PropTypes.string.isRequired
};

export default Documents;
