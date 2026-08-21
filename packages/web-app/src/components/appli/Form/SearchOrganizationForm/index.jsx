import { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';

import OfflineDisabled from '@/components/common/OfflineDisabled';
import { useOnlineStatus, resetAdvancedSearch } from '@/hooks';
import { ADVANCED_SEARCH_TYPES } from '../../../../conf/config';
import OrganizationsSearch from '../../AdvancedSearch/OrganizationsSearch';
import SearchResults from '../../AdvancedSearch/SearchResults';

const SearchOrganizationForm = ({ onSubmit }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);

  const resetForm = () => {
    resetAdvancedSearch();
    setSelectedOrganizations([]);
  };

  const handleSelection = (ids, results) => {
    setSelectedOrganizations(results.filter(r => ids.includes(r.id)));
  };

  const handleOnSubmit = () => {
    onSubmit(selectedOrganizations);
    resetForm();
  };

  return (
    <Box>
      <OrganizationsSearch />
      <SearchResults
        onSelected={handleSelection}
        hideExport
        compact
        entityType={ADVANCED_SEARCH_TYPES.ORGANIZATIONS}
      />
      {/* The parent turns this into a joinOrganization write, so it needs the
          network. Guarding matters even without a mid-flow disconnection:
          advancedsearch results survive unmount, so reopening this panel
          offline re-displays a previous online selection, ready to submit. */}
      <Box sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
        <OfflineDisabled>
          <Button
            disabled={selectedOrganizations.length === 0 || !isOnline}
            color="primary"
            variant="contained"
            type="submit"
            onClick={handleOnSubmit}>
            {formatMessage({ id: 'Join' })}
          </Button>
        </OfflineDisabled>
      </Box>
    </Box>
  );
};

SearchOrganizationForm.propTypes = {
  onSubmit: PropTypes.func.isRequired
};

export default SearchOrganizationForm;
