import { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { Paper, Typography } from '@mui/material';
import SectionCreateButton from '@/components/common/SectionCreateButton';
import ContributionSection from '@/components/appli/Contributions/ContributionSection';
import NetworkInlineLink from '../../common/NetworkInlineLink';

import { DescriptionPropTypes } from '../../../types/description.type';
import Description from './Description';
import CreateDescriptionForm from '../EntitiesForm/Description';
import {
  useCreateDescription,
  useMoveDescriptionRelevance,
  usePermissions
} from '../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../hooks/useMoveRelevanceWithUndo';
import Alert from '../../common/Alert';
import AppLink from '../../common/AppLink';

const Descriptions = ({
  entityType,
  entityId,
  descriptions,
  isEditAllowed = true,
  isAddAllowed = true,
  networkId = undefined,
  networkName = undefined,
  networkDescriptionsCount = 0
}) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const hasNetworkDescriptions =
    !!networkId && !!networkName && networkDescriptionsCount > 0;
  const [isFormVisible, setIsFormVisible] = useState(false);
  const createMutation = useCreateDescription();
  const moveMutation = useMoveDescriptionRelevance();
  const { movingId, handleMove } = useMoveRelevanceWithUndo(moveMutation);

  const onSubmitForm = data => {
    createMutation.mutate({
      [entityType]: entityId,
      title: data.title,
      body: data.body,
      language: data.language
    });
    setIsFormVisible(false);
  };

  return (
    <ContributionSection
      anchorId="description"
      defaultExpanded={descriptions.length > 0 || hasNetworkDescriptions}
      title={formatMessage({ id: 'Description' })}
      items={descriptions}
      renderItem={(description, { isFirst, isLast }) => (
        <Description
          description={description}
          isEditAllowed={isEditAllowed}
          isMoving={movingId === description.id}
          onMoveUp={() => handleMove(description.id, -1)}
          onMoveDown={() => handleMove(description.id, 1)}
          isFirst={isFirst}
          isLast={isLast}
          parentId={entityId}
          parentType={entityType}
        />
      )}
      createAction={
        permissions.isAuth &&
        isEditAllowed &&
        isAddAllowed && (
          <SectionCreateButton
            isOpen={isFormVisible}
            onToggle={() => setIsFormVisible(!isFormVisible)}
            label={formatMessage({ id: 'New' })}
            tooltip={formatMessage({ id: 'Add a new description' })}
            openTooltip={formatMessage({
              id: 'Cancel adding a new description'
            })}
          />
        )
      }
      beforeContent={
        hasNetworkDescriptions ? (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              mb: 1,
              borderRadius: 2,
              borderLeftWidth: 3,
              borderLeftColor: 'secondary.main',
              bgcolor: 'grey.50'
            }}>
            <Typography variant="body1" sx={{ overflowWrap: 'anywhere' }}>
              <FormattedMessage
                id="network.descriptions.callout"
                values={{
                  networkLink: (
                    <NetworkInlineLink
                      caveId={networkId}
                      label={networkName}
                      size={18}
                      variant="body1"
                    />
                  ),
                  descriptionsLink: (
                    <AppLink
                      to={`/ui/caves/${networkId}#description`}
                      openInNewTabDesktop
                      variant="body1"
                      sx={{ display: 'inline', verticalAlign: 'baseline' }}>
                      {formatMessage(
                        { id: 'network.descriptions.count' },
                        { count: networkDescriptionsCount }
                      )}
                    </AppLink>
                  )
                }}
              />
            </Typography>
          </Paper>
        ) : null
      }
      form={
        isFormVisible ? (
          <CreateDescriptionForm isNewDescription onSubmit={onSubmitForm} />
        ) : null
      }
      emptyState={
        <Alert
          severity="info"
          content={formatMessage({ id: `descriptions.none.${entityType}` })}
        />
      }
    />
  );
};

Descriptions.propTypes = {
  entityType: PropTypes.oneOf(['entrance', 'cave', 'massif']),
  entityId: PropTypes.number.isRequired,
  descriptions: PropTypes.arrayOf(DescriptionPropTypes),
  isEditAllowed: PropTypes.bool,
  isAddAllowed: PropTypes.bool,
  networkId: PropTypes.number,
  networkName: PropTypes.string,
  networkDescriptionsCount: PropTypes.number
};

export default Descriptions;
