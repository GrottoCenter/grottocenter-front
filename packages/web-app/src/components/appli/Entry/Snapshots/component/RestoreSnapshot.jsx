import * as React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip
} from '@mui/material';
import RestorePageIcon from '@mui/icons-material/RestorePage';
import { pathOr } from 'ramda';
import { useIntl } from 'react-intl';
import { updateDescription } from '../../../../../actions/Description/UpdateDescription';
import { updateHistory } from '../../../../../actions/History/UpdateHistory';
import { updateRiggings } from '../../../../../actions/Riggings/UpdateRigging';
import { updateLocation } from '../../../../../actions/Location/UpdateLocation';
import { updateComment } from '../../../../../actions/Comment/UpdateComment';
import { rollbackGuideline } from '../../../../../actions/Guideline/RollbackGuideline';
import { usePermissions, useUserProperties } from '../../../../../hooks';
import { updateEntrance } from '../../../../../actions/Entrance/UpdateEntrance';
import { updateCaveAndEntrance } from '../../../../../actions/CaveAndEntrance';
import Translate from '../../../../common/Translate';
import { durationStringToMinutes } from '../../../../../utils/dateTimeDuration';

function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve, ms));
}
const RestoreSnapshot = ({ snapshot, snapshotType, isNetwork, actualItem }) => {
  const dispatch = useDispatch();
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
            await dispatch(
              updateComment({
                ...content,
                id: content.t_id,
                eTTrail: durationStringToMinutes(content.eTTrail),
                eTUnderground: durationStringToMinutes(content.eTUnderground)
              })
            );
          }
          break;
        case 'descriptions':
          await dispatch(
            updateDescription({
              ...content,
              id: content.t_id
            })
          );
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
            await dispatch(updateEntrance(updatedEntrance));
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
            await dispatch(updateCaveAndEntrance(updatedCave, updatedEntrance));
          }
          break;
        }
        case 'histories':
          await dispatch(
            updateHistory({
              ...content,
              id: content.t_id
            })
          );
          break;
        case 'locations':
          await dispatch(
            updateLocation({
              ...content,
              id: content.t_id
            })
          );
          break;
        case 'riggings':
          await dispatch(
            updateRiggings({
              ...content,
              id: content.t_id
            })
          );
          break;
        case 'guidelines':
          await dispatch(
            rollbackGuideline({
              id: content.t_id,
              snapshotId: content.id
            })
          );
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
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle id="alert-dialog-title">
            <Translate>Restore this revision?</Translate>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              <Translate>
                If you click YES, the content of this revision will be saved as
                the new current revision.
              </Translate>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>
              <Translate>No</Translate>
            </Button>
            <Button
              onClick={() => restoreSnapshot(snapshotType, snapshot)}
              color="secondary"
              autoFocus>
              <Translate>Yes</Translate>
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={openSuccess}>
          <DialogTitle id="alert-dialog-title">
            <Translate>Restore completed</Translate>
          </DialogTitle>
          <DialogContent>
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
          </DialogContent>
          {!hasOpener && (
            <DialogActions>
              <Button onClick={() => setOpenSuccess(false)}>
                <Translate>Close</Translate>
              </Button>
            </DialogActions>
          )}
        </Dialog>
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
