import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { Box, Button, Typography } from '@mui/material';

import EntitiesList from '../entitiesList/EntitiesList';
import Alert from '../Alert';
import StandardDialog from '../StandardDialog';
import { NetworkPropTypes } from '../../../types/grotto.type';
import { EntranceSimplePropTypes } from '../../../types/entrance.type';
import SearchCaveForm from '../../appli/Form/SearchCaveForm';
import { linkCave } from '../../../actions/Cave/LinkCave';
import { unlinkCave } from '../../../actions/Cave/UnlinkCave';
import { getEntranceUrl } from '../../../conf/apiRoutes';

const RelatedCaves = ({
  exploredEntrances,
  exploredNetworks,
  entityId,
  isOrganization,
  canManageCaves,
  onRefresh,
  isCaveSearchVisible,
  onToggleCaveSearch
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const [isAdding, setIsAdding] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);

  const fetchCaveIdFromEntrance = useCallback(async entranceId => {
    const response = await fetch(`${getEntranceUrl}${entranceId}`);
    const entranceData = await response.json();
    return entranceData.cave?.id;
  }, []);

  const handleUnlinkCave = useCallback(async caveId => {
    try {
      await dispatch(unlinkCave(caveId, entityId, isOrganization));
      onRefresh();
    } catch (error) {
      console.error('Error unlinking cave:', error);
    }
  }, [dispatch, entityId, isOrganization, onRefresh]);

  const handleUnlinkEntrance = useCallback(async entranceId => {
    try {
      const caveId = await fetchCaveIdFromEntrance(entranceId);
      if (caveId) {
        await handleUnlinkCave(caveId);
      }
    } catch (error) {
      console.error('Error unlinking entrance:', error);
    }
  }, [fetchCaveIdFromEntrance, handleUnlinkCave]);

  const requestUnlink = useCallback((id, type) => {
    const list = type === 'cave' ? (exploredNetworks ?? []) : (exploredEntrances ?? []);
    const item = list.find(e => e.id === id);
    setPendingRemove({ id, type, label: item?.name });
  }, [exploredNetworks, exploredEntrances]);

  const handleConfirmRemove = useCallback(async () => {
    if (!pendingRemove) return;
    const { id, type } = pendingRemove;
    setPendingRemove(null);
    if (type === 'cave') {
      await handleUnlinkCave(id);
    } else {
      await handleUnlinkEntrance(id);
    }
  }, [pendingRemove, handleUnlinkCave, handleUnlinkEntrance]);

  const handleCancelRemove = useCallback(() => {
    setPendingRemove(null);
  }, []);

  const onSubmitForm = useCallback(async selectedEntrances => {
    onToggleCaveSearch(false);
    setIsAdding(true);

    try {
      for (const entrance of selectedEntrances) {
        const entranceId = entrance.id || entrance['@id'];
        const caveId = await fetchCaveIdFromEntrance(entranceId);

        if (caveId) {
          try {
            await dispatch(linkCave(caveId, entityId, isOrganization));
          } catch (error) {
            if (error.body?.message?.includes('already')) {
              console.warn(
                `Cave ${caveId} is already linked to entity ${entityId}`
              );
            } else {
              console.error(`Error linking cave ${caveId}:`, error);
            }
          }
        }
      }
      onRefresh();
    } catch (error) {
      console.error('Error linking cave:', error);
    } finally {
      setIsAdding(false);
    }
  }, [dispatch, entityId, fetchCaveIdFromEntrance, isOrganization, onRefresh, onToggleCaveSearch]);

  const toolTipTitle = formatMessage({
    id: isOrganization
      ? 'Remove from organization'
      : 'Remove from my explored caves'
  });

  const isEmpty =
    (exploredNetworks ?? []).length === 0 &&
    (exploredEntrances ?? []).length === 0;

  return (
    <>
      {isCaveSearchVisible && <SearchCaveForm onSubmit={onSubmitForm} />}
      {isAdding ? (
        <Alert severity="info" title={formatMessage({ id: 'Loading ...' })} />
      ) : isEmpty && !isCaveSearchVisible ? (
        <Alert
          severity="info"
          title={formatMessage({ id: 'No explored caves found.' })}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <EntitiesList
            type="cave"
            entities={exploredNetworks}
            onItemRemove={canManageCaves ? id => requestUnlink(id, 'cave') : null}
            toolTipTitle={toolTipTitle}
          />
          <EntitiesList
            type="entrance"
            entities={exploredEntrances}
            onItemRemove={canManageCaves ? id => requestUnlink(id, 'entrance') : null}
            toolTipTitle={toolTipTitle}
          />
        </Box>
      )}

      <StandardDialog
        open={!!pendingRemove}
        onClose={handleCancelRemove}
        fullWidth
        maxWidth="xs"
        title={toolTipTitle}
        actions={
          <>
            <Button onClick={handleCancelRemove} variant="text">
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button onClick={handleConfirmRemove} color="error" autoFocus>
              {formatMessage({ id: 'Remove' })}
            </Button>
          </>
        }>
        {formatMessage(
          { id: 'Are you sure you want to unlink {name}?' },
          { name: <Typography component="span" fontWeight={700}>{pendingRemove?.label ?? '?'}</Typography> }
        )}
      </StandardDialog>
    </>
  );
};

RelatedCaves.propTypes = {
  exploredEntrances: PropTypes.arrayOf(EntranceSimplePropTypes),
  exploredNetworks: PropTypes.arrayOf(NetworkPropTypes),
  entityId: PropTypes.number.isRequired,
  isOrganization: PropTypes.bool.isRequired,
  canManageCaves: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isCaveSearchVisible: PropTypes.bool.isRequired,
  onToggleCaveSearch: PropTypes.func.isRequired
};

export default RelatedCaves;
