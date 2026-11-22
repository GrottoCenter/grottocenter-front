import * as React from 'react';
import PropTypes from 'prop-types';
import { Button, DialogContentText, Tooltip } from '@mui/material';
import RestorePageIcon from '@mui/icons-material/RestorePage';
import { pathOr } from 'ramda';
import { useIntl } from 'react-intl';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import StandardDialog from '@/components/common/StandardDialog';
import {
  useUpdateDescription,
  useUpdateHistory,
  useUpdateLocation,
  useUpdateRigging,
  useUpdateComment,
  useRollbackGuideline,
  useUpdateEntrance,
  useUpdateCaveAndEntrance,
  usePermissions,
  useUserProperties
} from '../../../../../hooks';
import Translate from '../../../../common/Translate';
import { durationStringToMinutes } from '../../../../../utils/dateTimeDuration';

function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve, ms));
}
const RestoreSnapshot = ({ snapshot, snapshotType, isNetwork, actualItem }) => {
  const updateDescriptionMutation = useUpdateDescription();
  const updateHistoryMutation = useUpdateHistory();
  const updateLocationMutation = useUpdateLocation();
  const updateRiggingMutation = useUpdateRigging();
  const updateCommentMutation = useUpdateComment();
  const rollbackGuidelineMutation = useRollbackGuideline();
  const updateEntranceMutation = useUpdateEntrance();
  const updateCaveAndEntranceMutation = useUpdateCaveAndEntrance();
  const userId = pathOr(null, ['id'], useUserProperties());
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const canEditComment =
    (snapshot.author?.id &&
      userId?.toString() === snapshot.author?.id.toString()) ||
    permissions.isAdmin ||
    permissions.isModerator;
  const [open, setOpen] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [hasOpener, setHasOpener] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const restoreSnapshot = async (typeItem, content) => {
    setOpen(false);
    try {
      switch (typeItem) {
        case 'comments':
          if (canEditComment) {
            await updateCommentMutation.mutateAsync({
              ...content,
              id: content.t_id,
              eTTrail: durationStringToMinutes(content.eTTrail),
              eTUnderground: durationStringToMinutes(content.eTUnderground)
            });
          }
          break;
        case 'descriptions':
          await updateDescriptionMutation.mutateAsync({
            ...content,
            id: content.t_id
          });
          break;
        case 'entrances': {
          const updatedEntrance = {
            name: {
              language: content.names[0].language,
              text: content.name
            },
            cave: content.cave?.id ?? content.cave,
            country: content.country,
            isSensitive: content.isSensitive,
            longitude: content.longitude,
            latitude: content.latitude,
            yearDiscovery: content.yearDiscovery,
            geology: content.geology,
            id: content.t_id
          };
          if (isNetwork) {
            await updateEntranceMutation.mutateAsync(updatedEntrance);
          } else {
            const updatedCave = {
              name: {
                language: content.languageName,
                text: content.caveName
              },
              depth: Number(content.cave.depth),
              isDiving: content.cave.isDiving,
              length: Number(content.cave.length),
              longitude: content.cave.longitude,
              latitude: content.cave.latitude,
              temperature: Number(content.cave.temperature),
              id: content.cave?.id
            };
            await updateCaveAndEntranceMutation.mutateAsync({
              caveData: updatedCave,
              entranceData: updatedEntrance
            });
          }
          break;
        }
        case 'histories':
          await updateHistoryMutation.mutateAsync({
            ...content,
            id: content.t_id
          });
          break;
        case 'locations':
          await updateLocationMutation.mutateAsync({
            ...content,
            id: content.t_id
          });
          break;
        case 'riggings':
          await updateRiggingMutation.mutateAsync({
            ...content,
            id: content.t_id
          });
          break;
        case 'guidelines':
          await rollbackGuidelineMutation.mutateAsync({
            id: content.t_id,
            snapshotId: content.id
          });
          break;
        default:
          break;
      }
      // window.opener is null when the user navigated directly to this URL
      // instead of arriving via window.open() (e.g. popup blocked by browser).
      if (window.opener) {
        setHasOpener(true);
        window.opener.location.reload();
        setOpenSuccess(true);
        sleep(10000).then(() => window.close());
      } else {
        setHasOpener(false);
        setOpenSuccess(true);
      }
    } catch {
      // Action dispatched UPDATE_X_FAILURE — ErrorHandler shows the error toast.
      // Do not show the success dialog.
    }
  };
  return (
    permissions.isAuth &&
    !actualItem?.isDeleted && (
      <>
        <Tooltip title={formatMessage({ id: 'Restore this version' })}>
          <Button
            onClick={handleClickOpen}
            startIcon={<RestorePageIcon />}
            variant="outlined"
            color="secondary">
            {formatMessage({ id: 'Restore' })}
          </Button>
        </Tooltip>
        <ConfirmationDialog
          open={open}
          onClose={handleClose}
          title={<Translate>Restore this revision?</Translate>}
          onConfirm={() => restoreSnapshot(snapshotType, snapshot)}
          cancelLabel={<Translate>No</Translate>}
          confirmLabel={<Translate>Yes</Translate>}>
          <DialogContentText>
            <Translate>
              If you click YES, the content of this revision will be saved as
              the new current revision.
            </Translate>
          </DialogContentText>
        </ConfirmationDialog>
        <StandardDialog
          open={openSuccess}
          onClose={hasOpener ? undefined : () => setOpenSuccess(false)}
          title={<Translate>Restore completed</Translate>}
          actions={
            !hasOpener && (
              <Button variant="contained" onClick={() => setOpenSuccess(false)}>
                <Translate>Close</Translate>
              </Button>
            )
          }>
          <DialogContentText>
            {hasOpener ? (
              <Translate>
                This window will be closed shortly and your origin page
                refreshed...
              </Translate>
            ) : (
              <Translate>
                The revision has been restored. You can close this tab and
                reload the page to see the changes.
              </Translate>
            )}
          </DialogContentText>
        </StandardDialog>
      </>
    )
  );
};

RestoreSnapshot.propTypes = {
  snapshot: PropTypes.shape({
    author: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  }).isRequired,
  snapshotType: PropTypes.string.isRequired,
  isNetwork: PropTypes.bool,
  actualItem: PropTypes.shape({
    isDeleted: PropTypes.bool
  })
};

export default RestoreSnapshot;
