import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Divider } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import SectionCreateButton from '@/components/common/SectionCreateButton';
import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import SearchDocumentForm from '../SearchDocumentForm';
import Alert from '../../common/Alert';
import {
  useLinkDocumentToMassif,
  useUnlinkDocumentToMassif,
  usePermissions
} from '../../../hooks';
import DocumentsList from '../../common/DocumentsList/DocumentsList';

const Documents = ({ documents, massifId }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isDocumentSearchVisible, setIsDocumentSearchVisible] = useState(false);
  const linkMutation = useLinkDocumentToMassif();
  const unlinkMutation = useUnlinkDocumentToMassif();

  const onSubmitForm = newDocuments => {
    newDocuments.forEach(d => {
      linkMutation.mutate({ massifId, document: d });
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
                : document =>
                    unlinkMutation.mutate({
                      massifId,
                      documentId: document.id
                    })
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
