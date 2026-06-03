import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, ListItem, ListItemText } from '@mui/material';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';
import { SnapshotButton } from '../Entry/Snapshots/UtilityFunction';
import GuidelinePropTypes from '../../../types/guideline.type';
import GuidelineForm from '../EntitiesForm/Guideline/index';
import { patchGuideline } from '../../../actions/Guideline/UpdateGuideline';
import { deleteGuideline } from '../../../actions/Guideline/DeleteGuideline';
import { restoreGuideline } from '../../../actions/Guideline/RestoreGuideline';
import ActionButtons from '../Entry/ActionButtons';
import SectionTitle from '../Entry/SectionTitle';
import { usePermissions } from '../../../hooks';
import Contribution from '../../common/Contribution/Contribution';

const ListItemStyled = styled(ListItem)`
  display: flow-root;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  padding-top: ${({ theme }) => theme.spacing(1)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
`;

const Guideline = ({
  guideline,
  isEditAllowed
}) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    setWantedDeletedState(guideline.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitForm = data => {
    dispatch(
      patchGuideline({
        id: guideline.id,
        title: data.title,
        description: data.description,
        language: data.language
      })
    );
    setIsUpdateFormVisible(false);
  };

  const onDeletePress = isPermanent => {
    setWantedDeletedState(true);
    dispatch(deleteGuideline({ id: guideline.id, isPermanent }));
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreGuideline({ id: guideline.id }));
  };

  const isActionLoading = wantedDeletedState !== guideline.isDeleted;

  return (
    <ListItemStyled disableGutters>
      {isEditAllowed && (
        <Box sx={{ float: 'right', ml: 1 }}>
          <ActionButtons
            isLoading={isActionLoading}
            isUpdating={isUpdateFormVisible}
            setIsUpdating={setIsUpdateFormVisible}
            isDeleted={guideline.isDeleted}
            canEdit={isEditAllowed && permissions.isAuth}
            canDelete={isEditAllowed && permissions.isModerator}
            snapshotEl={
              <SnapshotButton
                id={guideline.id}
                type="guidelines"
                content={guideline}
              />
            }
            onDeletePress={onDeletePress}
            onRestorePress={onRestorePress}
          />
        </Box>
      )}
      {isUpdateFormVisible && permissions.isAuth ? (
        <Box width="100%">
          <GuidelineForm
            closeForm={() => setIsUpdateFormVisible(false)}
            isNew={false}
            onSubmit={onSubmitForm}
            values={guideline}
          />
        </Box>
      ) : (
        <ListItemText
          style={{ margin: 0 }}
          disableTypography
          primary={
            <SectionTitle
              title={guideline.title}
              anchorId={`guideline-${guideline.id}`}
              isDeleted={guideline.isDeleted}
            />
          }
          secondary={
            <Contribution
              body={guideline.description}
              author={guideline.author}
              reviewer={guideline.reviewer}
              dateInscription={guideline.dateInscription}
              dateReviewed={guideline.dateReviewed}
              language={guideline.language}
              isDeleted={guideline.isDeleted}
            />
          }
        />
      )}
    </ListItemStyled>
  );
};

Guideline.propTypes = {
  guideline: GuidelinePropTypes,
  isEditAllowed: PropTypes.bool
};

export default Guideline;
