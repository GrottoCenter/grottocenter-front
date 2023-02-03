import * as React from 'react';
import { useDispatch } from 'react-redux';
import { IconButton } from '@material-ui/core';
import RestorePageIcon from '@material-ui/icons/RestorePage';
import { pathOr } from 'ramda';
import { updateDescription } from '../../../../../actions/Description/UpdateDescription';
import { updateHistory } from '../../../../../actions/History/UpdateHistory';
import { updateRiggings } from '../../../../../actions/Riggings/UpdateRigging';
import { updateLocation } from '../../../../../actions/Location/UpdateLocation';
import { updateComment } from '../../../../../actions/Comment/UpdateComment';
import { usePermissions, useUserProperties } from '../../../../../hooks';
import { updateEntrance } from '../../../../../actions/Entrance/UpdateEntrance';
import { updateCaveAndEntrance } from '../../../../../actions/CaveAndEntrance';

function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve, ms));
}
const RestoreSnapshot = item => {
  const dispatch = useDispatch();
  const { snapshot, snapshotType, isNetwork } = item;
  const userId = pathOr(null, ['id'], useUserProperties());
  const permissions = usePermissions();
  const canEditComment =
    (snapshot.author?.id &&
      userId?.toString() === snapshot.author?.id.toString()) ||
    permissions.isAdmin ||
    permissions.isModerator;
  const restoreSnapshot = (typeItem, content) => {
    switch (typeItem) {
      case 'comments':
        if (canEditComment) {
          dispatch(
            updateComment({
              ...content,
              id: content.t_id,
              title: content.title,
              eTTrail: content.eTTrail ? content.eTTrail.minutes : 0,
              eTUnderground: content.eTUnderground
                ? content.eTUnderground.minutes
                : 0
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
            language: content.nameLanguage,
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
            length: Number(content.cave.caveLength),
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
    sleep(500).then(() => window.close());
  };
  return (
    permissions.isAuth && (
      <IconButton onClick={() => restoreSnapshot(snapshotType, snapshot)}>
        <RestorePageIcon />
      </IconButton>
    )
  );
};

export default RestoreSnapshot;
