import React from 'react';
import PropTypes from 'prop-types';
import { GpsFixed, Public } from '@mui/icons-material';
import { Information, makeCoordinatesValue } from './utils';

export const OrganizationPopup = ({ organization }) => (
  <>
    <Information
      isTitle
      value={organization.name && organization.name.toUpperCase()}
      url={`/ui/organizations/${organization.id}`}
    />
    {organization.address && (
      <Information
        value={organization.address}
        icon={<Public color="primary" />}
      />
    )}
    <Information
      value={makeCoordinatesValue(
        organization.latitude,
        organization.longitude
      )}
      icon={<GpsFixed color="primary" />}
    />
  </>
);

OrganizationPopup.propTypes = {
  organization: PropTypes.shape({
    name: PropTypes.string,
    id: PropTypes.number,
    address: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number
  }).isRequired
};

export default OrganizationPopup;
