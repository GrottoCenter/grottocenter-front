import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, ListItem, ListItemText } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { SnapshotButton } from '../Entry/Snapshots/UtilityFunction';
import GuidelinePropTypes from '../../../types/guideline.type';
import GuidelineForm from '../EntitiesForm/Guideline/index';
import { patchGuideline } from '../../../actions/Guideline/UpdateGuideline';
import { deleteGuideline } from '../../../actions/Guideline/DeleteGuideline';
import { restoreGuideline } from '../../../actions/Guideline/RestoreGuideline';
import ActionButtons from '../Entry/ActionButtons';
import SectionTitle from '../Entry/SectionTitle';
import { usePermissions, useNotification } from '../../../hooks';
import Contribution from '../../common/Contribution/Contribution';

const ListItemStyled = styled(ListItem)`
  display: flow-root;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const Guideline = ({ guideline, isEditAllowed }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const { onError } = useNotification();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(
    guideline.isDeleted
  );

  useEffect(() => {
    setWantedDeletedState(guideline.isDeleted);
  }, [guideline.isDeleted]);

  const onSubmitForm = async data => {
    const result = await dispatch(
      patchGuideline({
        id: guideline.id,
        title: data.title,
        description: data.description,
        language: data.language
      })
    );
    if (result) setIsUpdateFormVisible(false);
  };

  const onDeletePress = async isPermanent => {
    setWantedDeletedState(true);
    // On success the reducer removes/updates the guideline in place. On failure
    // the request errored (e.g. a non-2xx response): surface it instead of
    // leaving the view silently stale, and revert the optimistic loading state.
    const ok = await dispatch(
      deleteGuideline({ id: guideline.id, isPermanent })
    );
    if (!ok) {
      setWantedDeletedState(guideline.isDeleted);
      onError(
        formatMessage({
          id: 'guidelines.delete_error',
          defaultMessage: 'Failed to delete the guideline'
        })
      );
    }
  };
  const onRestorePress = async () => {
    setWantedDeletedState(false);
    const ok = await dispatch(restoreGuideline({ id: guideline.id }));
    if (!ok) {
      setWantedDeletedState(guideline.isDeleted);
      onError(
        formatMessage({
          id: 'guidelines.restore_error',
          defaultMessage: 'Failed to restore the guideline'
        })
      );
    }
  };

  const isActionLoading = wantedDeletedState !== guideline.isDeleted;

  return (
    <ListItemStyled disableGutters>
      {isEditAllowed && (
        <Box sx={{ float: 'right', ml: 0.5 }}>
          <ActionButtons
            isLoading={isActionLoading}
            isUpdating={isUpdateFormVisible}
            setIsUpdating={setIsUpdateFormVisible}
            isDeleted={guideline.isDeleted}
            canEdit={isEditAllowed && permissions.isAuth}
            canDelete={isEditAllowed && permissions.isModerator}
            // Permanent deletion of a guideline is admin-only on the API
            // (guideline/delete.js), unlike its soft-delete which moderators may do.
            canPermanentlyDelete={isEditAllowed && permissions.isAdmin}
            snapshotEl={
              <SnapshotButton
                id={guideline.id}
                type="guidelines"
                isDeleted={guideline.isDeleted}
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
