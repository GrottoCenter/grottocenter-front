import PropTypes from 'prop-types';
import { Box } from '@mui/material';

import PublicationAuthorization from './PublicationAuthorization';

const CollectionPublicationRights = ({ disabled = false }) => (
  <Box data-testid="collection-publication-rights">
    <PublicationAuthorization required={false} disabled={disabled} />
  </Box>
);

CollectionPublicationRights.propTypes = { disabled: PropTypes.bool };

export default CollectionPublicationRights;
