import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button, Divider, List, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { DescriptionPropTypes } from '../../../types/description.type';
import Description from './Description';
import CreateDescriptionForm from '../EntitiesForm/Description';
import { postDescription } from '../../../actions/Description/CreateDescription';
import { moveDescriptionRelevance } from '../../../actions/Description/MoveRelevance';
import { usePermissions } from '../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../hooks/useMoveRelevanceWithUndo';
import { sortByRelevance } from '../../../helpers/sortByRelevance';
import Alert from '../../common/Alert';

const Descriptions = ({
  entityType,
  entityId,
  descriptions,
  isEditAllowed = true,
  isAddAllowed = true
}) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { movingId, handleMove } = useMoveRelevanceWithUndo(
    moveDescriptionRelevance
  );

  const onSubmitForm = data => {
    dispatch(
      postDescription({
        [entityType]: entityId,
        title: data.title,
        body: data.body,
        language: data.language
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      dense
      anchorId="description"
      defaultExpanded={descriptions.length > 0}
      title={formatMessage({ id: 'Description' })}
      icon={
        permissions.isAuth &&
        isEditAllowed &&
        isAddAllowed && (
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel adding a new description' })
                : formatMessage({ id: 'Add a new description' })
            }
          >
            <Button
              color={isFormVisible ? 'inherit' : 'secondary'}
              size="small"
              variant="outlined"
              onClick={() => setIsFormVisible(!isFormVisible)}
              startIcon={isFormVisible ? <CancelIcon /> : <AddCircleIcon />}
            >
              {formatMessage({ id: isFormVisible ? 'Cancel' : 'New' })}
            </Button>
          </Tooltip>
        )
      }
      content={
        <>
          {isFormVisible && (
            <>
              <CreateDescriptionForm isNewDescription onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          {descriptions.length > 0 ? (
            <List dense disablePadding>
              {(() => {
                const sorted = sortByRelevance(descriptions);
                const activeIds = sorted
                  .filter(d => !d.isDeleted)
                  .map(d => d.id);
                return sorted.map(description => (
                  <Description
                    description={description}
                    isEditAllowed={isEditAllowed}
                    isMoving={movingId === description.id}
                    key={description.id}
                    onMoveUp={() => handleMove(description.id, -1)}
                    onMoveDown={() => handleMove(description.id, 1)}
                    isFirst={description.id === activeIds[0]}
                    isLast={description.id === activeIds[activeIds.length - 1]}
                  />
                ));
              })()}
            </List>
          ) : (
            <Alert
              severity="info"
              content={formatMessage(
                { id: 'descriptions.none' },
                { entityType: formatMessage({ id: entityType }) }
              )}
            />
          )}
        </>
      }
    />
  );
};

Descriptions.propTypes = {
  entityType: PropTypes.oneOf(['entrance', 'cave', 'massif']),
  entityId: PropTypes.number.isRequired,
  descriptions: PropTypes.arrayOf(DescriptionPropTypes),
  isEditAllowed: PropTypes.bool,
  isAddAllowed: PropTypes.bool
};

export default Descriptions;
