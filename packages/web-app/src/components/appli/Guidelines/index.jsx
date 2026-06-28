import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography, List } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import { usePermissions } from '../../../hooks';
import GuidelinePropTypes from '../../../types/guideline.type';
import GuidelineForm from '../EntitiesForm/Guideline/index';
import Guideline from './Guideline';
import { postGuideline } from '../../../actions/Guideline/CreateGuideline';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';

const Guidelines = ({ entityType, entityId, guidelines }) => {
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      postGuideline({
        entityType,
        entityId,
        title: data.title,
        description: data.description,
        language: data.language
      })
    );
    setIsFormVisible(false);
  };

  if (!guidelines?.length && !permissions.isAuth) return null;

  return (
    <ScrollableContent
      title={<FormattedMessage id="Guidelines" />}
      anchorId="guidelines"
      id="guidelines"
      actionElement={
        permissions.isAuth &&
        !isFormVisible && (
          <Button
            size="small"
            color="primary"
            variant="outlined"
            onClick={() => setIsFormVisible(true)}
            data-testid="add-guideline-btn"
          >
            <FormattedMessage id="guidelines.add" defaultMessage="Add a new guideline" />
          </Button>
        )
      }
    >
      <Box p={2}>
        {isFormVisible && (
          <GuidelineForm
            isNew={true}
            closeForm={() => setIsFormVisible(false)}
            onSubmit={onSubmitForm}
          />
        )}
        {guidelines && guidelines.length > 0 ? (
          <List disablePadding>
            {guidelines.map(guideline => (
              <Guideline
                key={guideline.id}
                guideline={guideline}
                isEditAllowed={true}
              />
            ))}
          </List>
        ) : (
          !isFormVisible && (
            <Typography variant="body2" color="textSecondary">
              <FormattedMessage
                id="guidelines.none"
                values={{ entityType }}
              />
            </Typography>
          )
        )}
      </Box>
    </ScrollableContent>
  );
};

Guidelines.propTypes = {
  entityType: PropTypes.string.isRequired,
  entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  guidelines: PropTypes.arrayOf(GuidelinePropTypes)
};

export default Guidelines;
