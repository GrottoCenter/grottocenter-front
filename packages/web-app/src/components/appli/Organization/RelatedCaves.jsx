import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { Button, Tooltip, Divider, Typography } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';

import EntitiesList from '../../common/entitiesList/EntitiesList';
import Alert from '../../common/Alert';
import { NetworkPropTypes } from '../../../types/grotto.type';
import { EntranceSimplePropTypes } from '../../../types/entrance.type';
import { usePermissions } from '../../../hooks';
import SearchCaveForm from '../Form/SearchCaveForm';
import { linkCave } from '../../../actions/Cave/LinkCave';
import { unlinkCave } from '../../../actions/Cave/UnlinkCave';
import { fetchOrganization } from '../../../actions/Organization/GetOrganization';
import { getEntranceUrl } from '../../../conf/apiRoutes';

const DividerStyled = styled(Divider)`
  background-color: ${props => props.theme.palette.divider}; 
`;

const RelatedCaves = ({ exploredEntrances, exploredNetworks, organizationId, isMember }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isCaveSearchVisible, setIsCaveSearchVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const canManageCaves = permissions.isAdmin || permissions.isModerator || isMember;

  const fetchCaveIdFromEntrance = async entranceId => {
    const response = await fetch(`${getEntranceUrl}${entranceId}`);
    const entranceData = await response.json();
    return entranceData.cave?.id;
  };

  const handleUnlinkEntrance = async entranceId => {
    try {
      const caveId = await fetchCaveIdFromEntrance(entranceId);
      if (caveId) {
        await dispatch(unlinkCave(caveId, organizationId));
        dispatch(fetchOrganization(organizationId));
      }
    } catch (error) {
      console.error('Error unlinking cave:', error);
    }
  };

  const handleUnlinkCave = async caveId => {
    try {
      await dispatch(unlinkCave(caveId, organizationId));
      dispatch(fetchOrganization(organizationId));
    } catch (error) {
      console.error('Error unlinking cave:', error);
    }
  };

  const onSubmitForm = async selectedEntrances => {
    setIsCaveSearchVisible(false);
    setIsAdding(true);
    
    try {
      for (const entrance of selectedEntrances) {
        const entranceId = entrance.id || entrance['@id'];
        const caveId = await fetchCaveIdFromEntrance(entranceId);
        
        if (caveId) {
          try {
            await dispatch(linkCave(caveId, organizationId));
          } catch (error) {
            if (error.body?.message?.includes('already')) {
              console.warn(`Cave ${caveId} is already linked to organization ${organizationId}`);
            } else {
              console.error(`Error linking cave ${caveId}:`, error);
            }
          }
        }
      }
      dispatch(fetchOrganization(organizationId));
    } catch (error) {
      console.error('Error linking cave:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      {isCaveSearchVisible && (
        <>
          <SearchCaveForm onSubmit={onSubmitForm} />
          <DividerStyled />
        </>
      )}
      {isAdding ? (
        <Alert severity="info" title={formatMessage({ id: 'Loading ...' })} />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            <Typography variant="h3" gutterBottom>
              {formatMessage({ id: 'Explored caves' })}
            </Typography>
            {canManageCaves && (
              <Tooltip
                title={
                  isCaveSearchVisible
                    ? formatMessage({ id: 'Cancel this search' })
                    : formatMessage({ id: 'Add a cave' })
                }>
                <Button
                  color={isCaveSearchVisible ? 'inherit' : 'secondary'}
                  variant="outlined"
                  onClick={() => setIsCaveSearchVisible(!isCaveSearchVisible)}
                  startIcon={isCaveSearchVisible ? <CancelIcon /> : <AddCircleIcon />}>
                  {formatMessage({
                    id: isCaveSearchVisible ? 'Cancel' : 'Add'
                  })}
                </Button>
              </Tooltip>
            )}
          </div>
          {exploredNetworks.length === 0 && exploredEntrances.length === 0 ? (
            <Alert severity="info" title={formatMessage({ id: 'No explored caves found.' })} />
          ) : (
            <>
              <EntitiesList
                type="cave"
                entites={exploredNetworks}
                onItemRemove={canManageCaves ? handleUnlinkCave : null}
              />
              <EntitiesList
                type="entrance"
                entites={exploredEntrances}
                onItemRemove={canManageCaves ? handleUnlinkEntrance : null}
              />
            </>
          )}
        </>
      )}
    </>
  );
};

RelatedCaves.propTypes = {
  exploredEntrances: PropTypes.arrayOf(EntranceSimplePropTypes),
  exploredNetworks: PropTypes.arrayOf(NetworkPropTypes),
  organizationId: PropTypes.number.isRequired,
  isMember: PropTypes.bool.isRequired
};

export default RelatedCaves;
