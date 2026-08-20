import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Skeleton, Box, Button, Typography } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import {
  usePermissions,
  useNotification,
  useSetCountryOrganization,
  useRemoveCountryOrganization,
  useSetRegionOrganization,
  useRemoveRegionOrganization,
  useSetMassifOrganization,
  useRemoveMassifOrganization
} from '../../../hooks';

import AssociationForm from './AssociationForm';
import EntitiesList from '../../common/entitiesList/EntitiesList';
import Alert from '../../common/Alert';
import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';
import SectionCreateButton from '../../common/SectionCreateButton';
import StandardDialog from '../../common/StandardDialog';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';

// Both set/remove hooks are read for a given entity type; the effective pair
// is chosen at call time so the same component covers country/region/massif.
const useAssociationMutations = (entityType, parentEntityId, entityId) => {
  const setCountry = useSetCountryOrganization();
  const removeCountry = useRemoveCountryOrganization();
  const setRegion = useSetRegionOrganization();
  const removeRegion = useRemoveRegionOrganization();
  const setMassif = useSetMassifOrganization();
  const removeMassif = useRemoveMassifOrganization();

  if (entityType === 'country') {
    return {
      setMutation: setCountry,
      removeMutation: removeCountry,
      makeSetArgs: orgData => ({
        countryId: entityId,
        organizationId: orgData.id,
        organizationName: orgData.name
      }),
      makeRemoveArgs: orgId => ({
        countryId: entityId,
        organizationId: orgId
      })
    };
  }
  if (entityType === 'region') {
    return {
      setMutation: setRegion,
      removeMutation: removeRegion,
      makeSetArgs: orgData => ({
        countryId: parentEntityId,
        regionId: entityId,
        organizationId: orgData.id,
        organizationName: orgData.name
      }),
      makeRemoveArgs: orgId => ({
        countryId: parentEntityId,
        regionId: entityId,
        organizationId: orgId
      })
    };
  }
  return {
    setMutation: setMassif,
    removeMutation: removeMassif,
    makeSetArgs: orgData => ({
      massifId: entityId,
      organizationId: orgData.id,
      organizationName: orgData.name
    }),
    makeRemoveArgs: orgId => ({
      massifId: entityId,
      organizationId: orgId
    })
  };
};

const AssociationSection = ({
  organizations = [],
  entityType,
  entityId,
  parentEntityId,
  isLoading = false
}) => {
  const { formatMessage } = useIntl();
  const { onError } = useNotification();

  const { isAuth } = usePermissions();
  const canManageAssociations = isAuth;

  const { setMutation, removeMutation, makeSetArgs, makeRemoveArgs } =
    useAssociationMutations(entityType, parentEntityId, entityId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orgToRemove, setOrgToRemove] = useState(null);

  const isPending = setMutation.isPending || removeMutation.isPending;
  // The AssociationForm expects the legacy REDUCER_STATUS enum. Bridging here
  // (rather than reshaping the form) keeps the change local.
  const status = (() => {
    if (setMutation.isPending) return REDUCER_STATUS.LOADING;
    if (setMutation.isError) return REDUCER_STATUS.FAILED;
    if (setMutation.isSuccess) return REDUCER_STATUS.SUCCEEDED;
    return undefined;
  })();
  const error = setMutation.error ?? removeMutation.error;

  const handleSet = orgData => {
    setMutation.mutate(makeSetArgs(orgData), {
      onError: err =>
        onError(
          err?.body?.message ||
            err?.message ||
            formatMessage({ id: 'An error occurred while saving.' })
        )
    });
  };

  const handleRemove = () => {
    if (!orgToRemove) return;
    removeMutation.mutate(makeRemoveArgs(orgToRemove.id), {
      onSuccess: () => setOrgToRemove(null),
      onError: err =>
        onError(
          err?.body?.message ||
            err?.message ||
            formatMessage({ id: 'An error occurred while saving.' })
        )
    });
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
                status={status}
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
                    disabled={isPending}>
                    {formatMessage({ id: 'Cancel' })}
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    startIcon={<LinkOffIcon />}
                    onClick={handleRemove}
                    disabled={isPending}>
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
