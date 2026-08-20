import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Divider } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { styled } from '@mui/material/styles';
import NewEntityButton from '@/components/common/NewEntityButton';
import SectionCreateButton from '@/components/common/SectionCreateButton';
import { EntityIcon } from '../../../../pages/EntityCreation/entityConfig';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import SearchDocumentForm from '../../SearchDocumentForm';
import Alert from '../../../common/Alert';
import {
  useLinkDocumentToEntrance,
  useUnlinkDocumentToEntrance,
  usePermissions
} from '../../../../hooks';
import DocumentsList from '../../../common/DocumentsList/DocumentsList';

const DividerStyled = styled(Divider)`
  background-color: ${props => props.theme.palette.divider};
`;
const Documents = ({ documents, entranceId, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isDocumentSearchVisible, setIsDocumentSearchVisible] = useState(false);
  const linkMutation = useLinkDocumentToEntrance();
  const unlinkMutation = useUnlinkDocumentToEntrance();

  const onSubmitForm = newDocuments => {
    newDocuments.forEach(d => {
      linkMutation.mutate({ entranceId, document: d });
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
        permissions.isAuth &&
        isEditAllowed && (
          <Box display="flex" gap={0.5}>
            <NewEntityButton
              to={`/ui/entity/add/document?entranceId=${entranceId}`}
              size="small"
              tooltip={formatMessage({ id: 'Create a new document' })}
              icon={<EntityIcon iconType="bibliography" size={20} />}
            />
            <SectionCreateButton
              isOpen={isDocumentSearchVisible}
              onToggle={() =>
                setIsDocumentSearchVisible(!isDocumentSearchVisible)
              }
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
          </Box>
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
            emptyMessageComponent={
              <Alert
                severity="info"
                content={formatMessage({
                  id: 'There is currently no document for this entrance.'
                })}
              />
            }
            onUnlink={
              permissions.isModerator && isEditAllowed
                ? document =>
                    unlinkMutation.mutate({
                      entranceId,
                      documentId: document.id
                    })
                : null
            }
          />
        </>
      }
    />
  );
};

Documents.propTypes = {
  documents: DocumentsList.propTypes.documents,
  entranceId: PropTypes.number.isRequired,
  isEditAllowed: PropTypes.bool
};

export default Documents;
