import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Skeleton, Box, Button, Typography } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { usePermissions, useNotification } from '../../../hooks';

import AssociationForm from './AssociationForm';
import EntitiesList from '../../common/entitiesList/EntitiesList';
import Alert from '../../common/Alert';
import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';
import SectionCreateButton from '../../common/SectionCreateButton';
import StandardDialog from '../../common/StandardDialog';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import {
  setCountryOrganization,
  removeCountryOrganization,
  resetCountryOrganization
} from '../../../actions/Country/CountryOrganization';
import {
  setRegionOrganization,
  removeRegionOrganization,
  resetRegionOrganization
} from '../../../actions/Region/RegionOrganization';
import {
  setMassifOrganization,
  removeMassifOrganization,
  resetMassifOrganization
} from '../../../actions/Massif/MassifOrganization';
import { fetchCountry } from '../../../actions/Country/GetCountry';
import { fetchRegion } from '../../../actions/Region/GetRegion';
import { loadMassif } from '../../../actions/Massif/GetMassif';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';

// Maps an entityType to its Redux reducer key registered in GCReducer.
const ORGANIZATION_REDUCER_KEYS = {
  country: 'countryOrganization',
  region: 'regionOrganization',
  massif: 'massifOrganization'
};

const AssociationSection = ({
  organizations = [],
  entityType,
  entityId,
  parentEntityId,
  isLoading = false
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { onError } = useNotification();

  const { isAuth } = usePermissions();
  const canManageAssociations = isAuth;

  const reducerKey = ORGANIZATION_REDUCER_KEYS[entityType];
  const reducerState = useSelector(state => state[reducerKey]);
  const status = reducerState?.status;
  const error = reducerState?.error;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orgToRemove, setOrgToRemove] = useState(null);
  // Both track an in-flight set/remove operation, but serve different purposes:
  // - isPending is React state, driving re-renders to disable buttons / show progress.
  // - pendingOperationRef is a ref read inside the status effect to tell "our" status
  //   transitions apart from unrelated ones (e.g. another instance) without re-triggering it.
  const [isPending, setIsPending] = useState(false);
  const pendingOperationRef = useRef(false);

  // Refresh entity data when association is updated successfully
  useEffect(() => {
    if (pendingOperationRef.current && status === REDUCER_STATUS.SUCCEEDED) {
      if (entityType === 'country') {
        dispatch(fetchCountry(entityId));
        dispatch(resetCountryOrganization());
      } else if (entityType === 'region') {
        dispatch(fetchRegion(parentEntityId, entityId));
        dispatch(resetRegionOrganization());
      } else if (entityType === 'massif') {
        dispatch(loadMassif(entityId));
        dispatch(resetMassifOrganization());
      }

      setOrgToRemove(null);
      setIsPending(false);
      pendingOperationRef.current = false;
    } else if (
      pendingOperationRef.current &&
      status === REDUCER_STATUS.FAILED
    ) {
      // Surface the failure: without this, a rejected set/remove just silently
      // re-enables the buttons (the in-form Alert is masked once isPending
      // clears below), so the user gets no feedback. Covers both flows.
      onError(
        error?.message ||
          formatMessage({ id: 'An error occurred while saving.' })
      );
      setIsPending(false);
      pendingOperationRef.current = false;
    }
  }, [
    status,
    error,
    dispatch,
    entityType,
    entityId,
    parentEntityId,
    onError,
    formatMessage
  ]);

  useEffect(
    () => () => {
      // Clean up reducer state on unmount to prevent stale status affecting other instances
      if (entityType === 'country') dispatch(resetCountryOrganization());
      else if (entityType === 'region') dispatch(resetRegionOrganization());
      else if (entityType === 'massif') dispatch(resetMassifOrganization());
    },
    [dispatch, entityType]
  );

  const handleSet = orgData => {
    setIsPending(true);
    pendingOperationRef.current = true;
    if (entityType === 'country') {
      dispatch(setCountryOrganization(entityId, orgData.id, orgData.name));
    } else if (entityType === 'region') {
      dispatch(
        setRegionOrganization(
          parentEntityId,
          entityId,
          orgData.id,
          orgData.name
        )
      );
    } else if (entityType === 'massif') {
      dispatch(setMassifOrganization(entityId, orgData.id, orgData.name));
    }
  };

  const handleRemove = () => {
    if (!orgToRemove) return;
    setIsPending(true);
    pendingOperationRef.current = true;
    if (entityType === 'country') {
      dispatch(removeCountryOrganization(entityId, orgToRemove.id));
    } else if (entityType === 'region') {
      dispatch(
        removeRegionOrganization(parentEntityId, entityId, orgToRemove.id)
      );
    } else if (entityType === 'massif') {
      dispatch(removeMassifOrganization(entityId, orgToRemove.id));
    }
  };

  const isEmpty = !organizations || organizations.length === 0;

  const associateButton = canManageAssociations && (
    <SectionCreateButton
      isOpen={isFormOpen}
      onToggle={() => setIsFormOpen(o => !o)}
      label={formatMessage({ id: 'Associate' })}
      icon={
        <EntityIcon iconType="organization" size={20} BadgeIcon={LinkIcon} />
      }
    />
  );

  return (
    <ScrollableContent
      dense
      anchorId="organizations"
      title={formatMessage({ id: 'Responsible organizations' })}
      subheader={formatMessage({
        id: 'Organizations in charge of managing this geographic entity and its caves.'
      })}
      count={organizations.length}
      defaultExpanded={!isEmpty}
      icon={associateButton}
      content={
        isLoading ? (
          <Skeleton
            variant="rectangular"
            height={60}
            sx={{ my: 0.5, borderRadius: 1 }}
          />
        ) : (
          <Box sx={{ my: 0.5 }}>
            {isFormOpen && (
              <AssociationForm
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleSet}
                status={isPending ? status : undefined}
                error={error}
              />
            )}

            <EntitiesList
              type="organization"
              entities={organizations}
              onItemRemove={
                canManageAssociations
                  ? id =>
                      setOrgToRemove(
                        organizations.find(o => o.id === id) || null
                      )
                  : undefined
              }
              toolTipTitle={formatMessage({ id: 'Remove association' })}
              emptyMessage={
                <Alert
                  severity="info"
                  disableMargins
                  content={formatMessage({
                    id: 'No organization is currently responsible for this geographic entity.'
                  })}
                />
              }
            />

            <StandardDialog
              open={!!orgToRemove}
              onClose={() => setOrgToRemove(null)}
              title={formatMessage({ id: 'Remove association' })}
              actions={
                <>
                  <Button
                    variant="outlined"
                    onClick={() => setOrgToRemove(null)}
                    disabled={isPending && status === REDUCER_STATUS.LOADING}>
                    {formatMessage({ id: 'Cancel' })}
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={handleRemove}
                    disabled={isPending && status === REDUCER_STATUS.LOADING}>
                    {formatMessage({ id: 'Remove' })}
                  </Button>
                </>
              }>
              <Typography>
                {formatMessage(
                  {
                    id: 'Are you sure you want to remove the association with "{name}"?'
                  },
                  { name: orgToRemove?.name || '' }
                )}
              </Typography>
            </StandardDialog>
          </Box>
        )
      }
    />
  );
};

AssociationSection.propTypes = {
  organizations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      isDeleted: PropTypes.bool,
      redirectTo: PropTypes.string
    })
  ),
  entityType: PropTypes.oneOf(['country', 'region', 'massif']).isRequired,
  entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  parentEntityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isLoading: PropTypes.bool
};

export default AssociationSection;
