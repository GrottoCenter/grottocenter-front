import * as React from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip
} from '@material-ui/core';
import RestorePageIcon from '@material-ui/icons/RestorePage';
import { pathOr } from 'ramda';
import { useIntl } from 'react-intl';
import { updateDescription } from '../../../../../actions/Description/UpdateDescription';
import { updateHistory } from '../../../../../actions/History/UpdateHistory';
import { updateRiggings } from '../../../../../actions/Riggings/UpdateRigging';
import { updateLocation } from '../../../../../actions/Location/UpdateLocation';
import { updateComment } from '../../../../../actions/Comment/UpdateComment';
import { usePermissions, useUserProperties } from '../../../../../hooks';
import { updateEntrance } from '../../../../../actions/Entrance/UpdateEntrance';
import { updateCaveAndEntrance } from '../../../../../actions/CaveAndEntrance';
import Translate from '../../../../common/Translate';
import { durationStringToMinutes } from '../../../../../util/dateTimeDuration';

function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve, ms));
}
const RestoreSnapshot = item => {
  const dispatch = useDispatch();
  const { snapshot, snapshotType, isNetwork } = item;
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
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const restoreSnapshot = (typeItem, content) => {
    setOpen(false);
    switch (typeItem) {
      case 'comments':
        if (canEditComment) {
          dispatch(
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
        dispatch(
          updateDescription({
            ...content,
            id: content.t_id
          })
        );
        break;
      case 'entrances':
        // eslint-disable-next-line no-case-declarations
        const updatedEntrance = {
          name: {
            language: content.names[0].language,
            text: content.name
          },
          cave: content.cave.id ?? content.cave,
          country: content.country,
          isSensitive: content.isSensitive,
          longitude: content.longitude,
          latitude: content.latitude,
          yearDiscovery: content.yearDiscovery,
          geology: content.geology,
          id: content.t_id
        };
        if (isNetwork) {
          dispatch(updateEntrance(updatedEntrance));
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
            id: content.cave.id
          };
          dispatch(updateCaveAndEntrance(updatedCave, updatedEntrance));
        }
        break;
      case 'histories':
        dispatch(
          updateHistory({
            ...content,
            id: content.t_id
          })
        );
        break;
      case 'locations':
        dispatch(
          updateLocation({
            ...content,
            id: content.t_id
          })
        );
        break;
      case 'riggings':
        dispatch(
          updateRiggings({
            ...content,
            id: content.t_id
          })
        );
        break;
      default:
        break;
    }
    window.opener.location.reload();
    setOpenSuccess(true);
    sleep(10000).then(() => window.close());
  };
  return (
    permissions.isAuth && (
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
            <Button onClick={handleClose} color="default">
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
              <Translate>
                This window will be closed shortly and your origin page
                refreshed...
              </Translate>
            </DialogContentText>
          </DialogContent>
        </Dialog>
      </>
    )
  );
};

export default RestoreSnapshot;
