import React from 'react';
import PropTypes from 'prop-types';
import CustomIcon from '../../../../CustomIcon';
import { Information } from './utils';

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
        icon={<CustomIcon size={25} type="location" />}
      />
    )}
  </>
);

OrganizationPopup.propTypes = {
  organization: PropTypes.shape({
    name: PropTypes.string,
    id: PropTypes.number,
    address: PropTypes.string
  }).isRequired
};

export default OrganizationPopup;
