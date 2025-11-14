import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { Button, Tooltip, Divider } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';

import CavesList from '../../common/cave/CavesList';
import EntrancesList from '../../common/entrance/EntrancesList';
import Alert from '../../common/Alert';
import { NetworkPropTypes } from '../../../types/grotto.type';
import { EntranceSimplePropTypes } from '../../../types/entrance.type';
import { usePermissions } from '../../../hooks';
import SearchCaveForm from '../Form/SearchCaveForm';
import { addCaveExplorer } from '../../../actions/Cave/AddExplorer';
import { removeCaveExplorer } from '../../../actions/Cave/RemoveExplorer';
import { fetchOrganization } from '../../../actions/Organization/GetOrganization';


const DividerStyled = styled(Divider)`
  background-color: ${props => props.theme.palette.divider};
`;

const RelatedCaves = ({ exploredEntrances, exploredNetworks, organizationId, isMember }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isCaveSearchVisible, setIsCaveSearchVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const canManageExplorers = permissions.isAdmin || permissions.isModerator || isMember;

  const fetchCaveIdFromEntrance = async entranceId => {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/v1/entrances/${entranceId}`
    );
    const entranceData = await response.json();
    return entranceData.cave?.id;
  };

  const handleRemoveEntrance = async entranceId => {
    try {
      const caveId = await fetchCaveIdFromEntrance(entranceId);
      if (caveId) {
        await dispatch(removeCaveExplorer(caveId, organizationId));
        dispatch(fetchOrganization(organizationId));
      }
    } catch (error) {
      console.error('Error removing explorer:', error);
    }
  };

  const handleRemoveCave = async caveId => {
    try {
      await dispatch(removeCaveExplorer(caveId, organizationId));
      dispatch(fetchOrganization(organizationId));
    } catch (error) {
      console.error('Error removing explorer:', error);
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
            await dispatch(addCaveExplorer(caveId, organizationId));
          } catch (error) {
            console.error(`Error adding explorer for cave ${caveId}:`, error);
          }
        }
      }
      dispatch(fetchOrganization(organizationId));
    } catch (error) {
      console.error('Error adding explorer:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      {canManageExplorers && (
        <div style={{ marginBottom: '16px' }}>
          <Tooltip
            title={
              isCaveSearchVisible
                ? formatMessage({ id: 'Cancel this search' })
                : formatMessage({ id: 'Add a cave' })
            }>
            <Button
              color={isCaveSearchVisible ? 'inherit' : 'secondary'}
              variant="outlined"
              onClick={() =>
                setIsCaveSearchVisible(!isCaveSearchVisible)
              }
              startIcon={
                isCaveSearchVisible ? <CancelIcon /> : <AddCircleIcon />
              }>
              {formatMessage({
                id: isCaveSearchVisible ? 'Cancel' : 'Add'
              })}
            </Button>
          </Tooltip>
        </div>
      )}
      {isCaveSearchVisible && (
        <>
          <SearchCaveForm onSubmit={onSubmitForm} />
          <DividerStyled />
        </>
      )}
      {isAdding ? (
        <Alert severity="info" title={formatMessage({ id: 'Adding caves...' })} />
      ) : (
        <EntrancesList
          entrances={exploredEntrances}
          title={formatMessage({ id: 'Explored entrances' })}
          onRemove={canManageExplorers ? handleRemoveEntrance : null}
          showRemove={canManageExplorers}
        />
      )}
      <br />
      <CavesList
        caves={exploredNetworks}
        title={formatMessage({ id: 'Explored networks' })}
        emptyMessageComponent={
          <Alert
            severity="info"
            title={formatMessage({
              id: 'No explored networks found.'
            })}
          />
        }
        onRemove={canManageExplorers ? handleRemoveCave : null}
        showRemove={canManageExplorers}
      />
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
