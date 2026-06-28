import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { Skeleton, Box, Typography, Link, Chip, Button, IconButton } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';

import AssociationForm from './AssociationForm';
import StandardDialog from '../../common/StandardDialog';
import { setCountryOrganization, removeCountryOrganization } from '../../../actions/Country/CountryOrganization';
import { setRegionOrganization, removeRegionOrganization } from '../../../actions/Region/RegionOrganization';
import { setMassifOrganization, removeMassifOrganization } from '../../../actions/Massif/MassifOrganization';
import { fetchCountry } from '../../../actions/Country/GetCountry';
import { fetchRegion } from '../../../actions/Region/GetRegion';
import { loadMassif } from '../../../actions/Massif/GetMassif';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';

const AssociationSection = ({
  organizations = [],
  entityType,
  entityId,
  parentEntityId,
  isLoading = false
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const authState = useSelector(state => state.login);
  const isAuth = !!authState?.authTokenDecoded;

  const reducerKey = `${entityType}Organization`;
  const reducerState = useSelector(state => state[reducerKey]);
  const status = reducerState?.status;
  const error = reducerState?.error;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orgToRemove, setOrgToRemove] = useState(null);

  // Refresh entity data when association is updated successfully
  useEffect(() => {
    if (status === REDUCER_STATUS.SUCCEEDED) {
      if (entityType === 'country') dispatch(fetchCountry(entityId));
      else if (entityType === 'region') dispatch(fetchRegion(parentEntityId, entityId));
      else if (entityType === 'massif') dispatch(loadMassif(entityId));
      
      setOrgToRemove(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleSet = (orgData) => {
    if (entityType === 'country') {
      dispatch(setCountryOrganization(entityId, orgData.id, orgData.name));
    } else if (entityType === 'region') {
      dispatch(setRegionOrganization(parentEntityId, entityId, orgData.id, orgData.name));
    } else if (entityType === 'massif') {
      dispatch(setMassifOrganization(entityId, orgData.id, orgData.name));
    }
  };

  const handleRemove = () => {
    if (!orgToRemove) return;
    if (entityType === 'country') {
      dispatch(removeCountryOrganization(entityId, orgToRemove.id));
    } else if (entityType === 'region') {
      dispatch(removeRegionOrganization(parentEntityId, entityId, orgToRemove.id));
    } else if (entityType === 'massif') {
      dispatch(removeMassifOrganization(entityId, orgToRemove.id));
    }
  };

  if (isLoading) {
    return <Skeleton variant="rectangular" height={60} sx={{ my: 1, borderRadius: 1 }} />;
  }

  const isEmpty = !organizations || organizations.length === 0;

  return (
    <Box sx={{ my: 2 }}>
      {isEmpty ? (
        entityType !== 'massif' && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {formatMessage({
              id: entityType === 'country'
                ? 'No organization is currently associated with this country.'
                : 'No organization is currently associated with this region.'
            })}
          </Typography>
        )
      ) : (
        organizations.map(org => {
          if (org.isDeleted) {
            return (
              <Box key={org.id} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" component="span" sx={{ textDecoration: 'line-through', mr: 1, color: 'text.disabled' }}>
                  {org.name}
                </Typography>
                <Chip size="small" color="warning" label={formatMessage({ id: 'Deleted' })} sx={{ mr: 1 }} />
                {org.redirectTo && (
                  <Typography variant="body2">
                    <Link component={RouterLink} to={`/ui/organizations/${org.redirectTo}`}>
                      {formatMessage({ id: 'View successor organization' })}
                    </Link>
                  </Typography>
                )}
                {isAuth && (
                  <IconButton
                    size="small"
                    color="error"
                    title={formatMessage({ id: 'Remove association' })}
                    onClick={() => setOrgToRemove(org)}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            );
          }

          return (
            <Box key={org.id} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Link component={RouterLink} to={`/ui/organizations/${org.id}`} sx={{ mr: 1 }}>
                {org.name}
              </Link>
              {isAuth && (
                <IconButton
                  size="small"
                  color="error"
                  title={formatMessage({ id: 'Remove association' })}
                  onClick={() => setOrgToRemove(org)}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          );
        })
      )}

      {isAuth && (
        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setIsFormOpen(true)}
          >
            {formatMessage({ id: 'Add/Edit organization' })}
          </Button>
        </Box>
      )}

      {isFormOpen && (
        <AssociationForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSet}
          status={status}
          error={error}
        />
      )}

      <StandardDialog
        open={!!orgToRemove}
        onClose={() => setOrgToRemove(null)}
        title={formatMessage({ id: 'Remove association' })}
        actions={
          <>
            <Button onClick={() => setOrgToRemove(null)} disabled={status === REDUCER_STATUS.LOADING}>
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleRemove}
              disabled={status === REDUCER_STATUS.LOADING}
            >
              {formatMessage({ id: 'Remove' })}
            </Button>
          </>
        }
      >
        <Typography>
          {formatMessage(
            { id: 'Are you sure you want to remove the association with "{name}"?' },
            { name: orgToRemove?.name || '' }
          )}
        </Typography>
      </StandardDialog>
    </Box>
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
  entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  parentEntityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isLoading: PropTypes.bool
};

export default AssociationSection;
