import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, Divider, Tooltip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { useDispatch } from 'react-redux';
import CancelIcon from '@mui/icons-material/Cancel';
import { linkDocumentToMassif } from '../../../actions/LinkDocumentToMassif';
import { unlinkDocumentToMassif } from '../../../actions/UnlinkDocumentToMassif';
import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import SearchDocumentForm from '../SearchDocumentForm';
import Alert from '../../common/Alert';
import OfflineDisabled from '../../common/OfflineDisabled';
import { usePermissions, useOnlineStatus } from '../../../hooks';
import DocumentsList from '../../common/DocumentsList/DocumentsList';

const Documents = ({ documents, massifId }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isDocumentSearchVisible, setIsDocumentSearchVisible] = useState(false);
  const dispatch = useDispatch();
  const isOnline = useOnlineStatus();

  const onSubmitForm = newDocuments => {
    newDocuments.forEach(d => {
      dispatch(linkDocumentToMassif({ massifId, document: d }));
    });
    setIsDocumentSearchVisible(false);
  };

  return (
    <ScrollableContent
      dense
      collapsible={false}
      anchorId="documents"
      title={formatMessage({ id: 'Documents' })}
      icon={
        permissions.isAuth && (
          // Opening blocked offline, closing always allowed: this same button
          // becomes Cancel while the search panel is open.
          <OfflineDisabled>
            <Tooltip
              title={formatMessage({
                id: isDocumentSearchVisible
                  ? 'Cancel this search'
                  : 'Assign an existing document'
              })}>
              <Button
                color={isDocumentSearchVisible ? 'inherit' : 'secondary'}
                size="small"
                variant="outlined"
                disabled={!isOnline && !isDocumentSearchVisible}
                onClick={() => setIsDocumentSearchVisible(v => !v)}
                startIcon={
                  isDocumentSearchVisible ? (
                    <CancelIcon />
                  ) : (
                    <EntityIcon
                      iconType="bibliography"
                      size={20}
                      BadgeIcon={LinkIcon}
                    />
                  )
                }>
                {formatMessage({
                  id: isDocumentSearchVisible ? 'Cancel' : 'Associate'
                })}
              </Button>
            </Tooltip>
          </OfflineDisabled>
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
          <DocumentsList
            documents={documents}
            emptyMessageComponent={
              <Alert
                severity="info"
                content={formatMessage({
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
