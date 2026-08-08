import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Divider } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { useDispatch } from 'react-redux';
import SectionCreateButton from '@/components/common/SectionCreateButton';
import { linkDocumentToMassif } from '../../../actions/LinkDocumentToMassif';
import { unlinkDocumentToMassif } from '../../../actions/UnlinkDocumentToMassif';
import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import SearchDocumentForm from '../SearchDocumentForm';
import Alert from '../../common/Alert';
import { usePermissions } from '../../../hooks';
import DocumentsList from '../../common/DocumentsList/DocumentsList';

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
      collapsible={false}
      anchorId="documents"
      title={formatMessage({ id: 'Documents' })}
      icon={
        permissions.isAuth && (
          <SectionCreateButton
            isOpen={isDocumentSearchVisible}
            onToggle={() => setIsDocumentSearchVisible(v => !v)}
            label={formatMessage({ id: 'Associate' })}
            tooltip={formatMessage({ id: 'Assign an existing document' })}
            openTooltip={formatMessage({ id: 'Cancel this search' })}
            icon={
              <EntityIcon
                iconType="bibliography"
                size={20}
                BadgeIcon={LinkIcon}
              />
            }
          />
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
