import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { Box, Button, Typography } from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';

import EntitiesList from '../entitiesList/EntitiesList';
import Alert from '../Alert';
import StandardDialog from '../StandardDialog';
import { NetworkPropTypes } from '../../../types/grotto.type';
import { EntranceSimplePropTypes } from '../../../types/entrance.type';
import SearchCaveForm from '../../appli/Form/SearchCaveForm';
import { linkCave } from '../../../actions/Cave/LinkCave';
import { unlinkCave } from '../../../actions/Cave/UnlinkCave';
import { linkExploredEntrance } from '../../../actions/Entrance/LinkExploredEntrance';
import { unlinkExploredEntrance } from '../../../actions/Entrance/UnlinkExploredEntrance';
import { getEntranceUrl } from '../../../conf/apiRoutes';
import ExploredEntrancesMap from '../Maps/MapClusters/ExploredEntrancesMap';

const noop = () => {};

const RelatedCaves = ({
  exploredEntrances,
  exploredNetworks,
  entityId,
  isOrganization,
  canManageCaves,
  onRefresh,
  isCaveSearchVisible = false,
  onToggleCaveSearch = noop,
  userId = null
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

  // Organizations still link whole caves; cavers link individual entrances.
  const handleUnlinkCave = useCallback(
    async caveId => {
      try {
        await dispatch(unlinkCave(caveId, entityId));
        onRefresh();
      } catch (error) {
        console.error('Error unlinking cave:', error);
      }
    },
    [dispatch, entityId, onRefresh]
  );

  const handleUnlinkOrganizationEntrance = useCallback(
    async entranceId => {
      try {
        const caveId = await fetchCaveIdFromEntrance(entranceId);
        if (caveId) {
          await handleUnlinkCave(caveId);
        }
      } catch (error) {
        console.error('Error unlinking entrance:', error);
      }
    },
    [fetchCaveIdFromEntrance, handleUnlinkCave]
  );

  const handleUnlinkExploredEntrance = useCallback(
    async entranceId => {
      try {
        await dispatch(unlinkExploredEntrance(entranceId, entityId));
        onRefresh();
      } catch (error) {
        console.error('Error unlinking entrance:', error);
      }
    },
    [dispatch, entityId, onRefresh]
  );

  const requestUnlink = useCallback(
    (id, type) => {
      const list =
        type === 'cave' ? (exploredNetworks ?? []) : (exploredEntrances ?? []);
      const item = list.find(e => e.id === id);
      setPendingRemove({ id, type, label: item?.name });
    },
    [exploredNetworks, exploredEntrances]
  );

  const handleConfirmRemove = useCallback(async () => {
    if (!pendingRemove) return;
    const { id, type } = pendingRemove;
    setPendingRemove(null);
    if (type === 'cave') {
      await handleUnlinkCave(id);
    } else if (isOrganization) {
      await handleUnlinkOrganizationEntrance(id);
    } else {
      await handleUnlinkExploredEntrance(id);
    }
  }, [
    pendingRemove,
    isOrganization,
    handleUnlinkCave,
    handleUnlinkOrganizationEntrance,
    handleUnlinkExploredEntrance
  ]);

  const handleCancelRemove = useCallback(() => {
    setPendingRemove(null);
  }, []);

  const onSubmitForm = useCallback(
    async selectedEntrances => {
      onToggleCaveSearch(false);
      setIsAdding(true);

      try {
        // Linking is sequential on purpose: each entrance is a separate
        // mutation, and a failure must be reported for that entrance alone
        // without cancelling the ones that follow.
        /* eslint-disable no-await-in-loop */
        for (const entrance of selectedEntrances) {
          const entranceId = entrance.id || entrance['@id'];
          try {
            if (isOrganization) {
              const caveId = await fetchCaveIdFromEntrance(entranceId);
              if (caveId) await dispatch(linkCave(caveId, entityId));
            } else {
              await dispatch(linkExploredEntrance(entranceId, entityId));
            }
          } catch (error) {
            if (error.body?.message?.includes('already')) {
              console.warn(
                `Entrance ${entranceId} is already linked to entity ${entityId}`
              );
            } else {
              console.error(`Error linking entrance ${entranceId}:`, error);
            }
          }
        }
        /* eslint-enable no-await-in-loop */
        onRefresh();
      } catch (error) {
        console.error('Error linking entrance:', error);
      } finally {
        setIsAdding(false);
      }
    },
    [
      dispatch,
      entityId,
      isOrganization,
      fetchCaveIdFromEntrance,
      onRefresh,
      onToggleCaveSearch
    ]
  );

  const toolTipTitle = formatMessage({
    id: isOrganization
      ? 'Remove from organization'
      : 'Remove from my explored entrances'
  });

  const isEmpty = isOrganization
    ? (exploredNetworks ?? []).length === 0 &&
      (exploredEntrances ?? []).length === 0
    : (exploredEntrances ?? []).length === 0;

  let listContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {isOrganization && (
        <EntitiesList
          type="cave"
          entities={exploredNetworks}
          onItemRemove={canManageCaves ? id => requestUnlink(id, 'cave') : null}
          toolTipTitle={toolTipTitle}
        />
      )}
      <EntitiesList
        type="entrance"
        entities={exploredEntrances}
        onItemRemove={
          canManageCaves ? id => requestUnlink(id, 'entrance') : null
        }
        toolTipTitle={toolTipTitle}
      />
    </Box>
  );
  if (isAdding) {
    listContent = (
      <Alert severity="info" title={formatMessage({ id: 'Loading ...' })} />
    );
  } else if (isEmpty && !isCaveSearchVisible) {
    // While the search form is open the empty state would just be noise.
    listContent = (
      <Alert
        severity="info"
        content={formatMessage({
          id: isOrganization
            ? 'No explored caves found.'
            : 'No explored entrances found.'
        })}
      />
    );
  }

  return (
    <>
      {isCaveSearchVisible && (
        <SearchCaveForm
          onSubmit={onSubmitForm}
          submitLabel={formatMessage({ id: 'Mark as explored' })}
        />
      )}
      {!isOrganization && userId && (
        <Box sx={{ mt: isCaveSearchVisible ? 0.25 : -2 }}>
          <ExploredEntrancesMap userId={userId} />
        </Box>
      )}
      {listContent}
      <StandardDialog
        open={!!pendingRemove}
        onClose={handleCancelRemove}
        fullWidth
        maxWidth="xs"
        title={toolTipTitle}
        actions={
          <>
            <Button onClick={handleCancelRemove} variant="outlined">
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              onClick={handleConfirmRemove}
              variant="contained"
              color="error"
              startIcon={<LinkOffIcon />}
              autoFocus>
              {formatMessage({ id: 'Remove' })}
            </Button>
          </>
        }>
        {formatMessage(
          { id: 'Are you sure you want to unlink {name}?' },
          {
            name: (
              <Typography component="span" fontWeight={700}>
                {pendingRemove?.label ?? '?'}
              </Typography>
            )
          }
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
  isCaveSearchVisible: PropTypes.bool,
  onToggleCaveSearch: PropTypes.func,
  userId: PropTypes.number
};

export default RelatedCaves;
