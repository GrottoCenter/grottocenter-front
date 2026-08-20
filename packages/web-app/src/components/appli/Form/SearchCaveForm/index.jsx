import { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';

import OfflineDisabled from '@/components/common/OfflineDisabled';
import { useOnlineStatus, resetAdvancedSearch } from '@/hooks';
import { ADVANCED_SEARCH_TYPES } from '../../../../conf/config';
import EntrancesSearch from '../../AdvancedSearch/EntrancesSearch';
import SearchResults from '../../AdvancedSearch/SearchResults';

const SearchCaveForm = ({ onSubmit, submitLabel = null }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const [selectedEntrances, setSelectedEntrances] = useState([]);

  const resetForm = () => {
    resetAdvancedSearch();
    setSelectedEntrances([]);
  };

  const handleSelection = (ids, results) => {
    const selectedResults = results.filter(r => ids.includes(r.id));
    setSelectedEntrances(selectedResults);
  };

  const handleOnSubmit = () => {
    onSubmit(selectedEntrances);
    resetForm();
  };

  return (
    <Box>
      <EntrancesSearch />
      <SearchResults
        onSelected={handleSelection}
        hideExport
        compact
        entityType={ADVANCED_SEARCH_TYPES.ENTRANCES}
      />
      <Box sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
        {/* The parent turns this into a linkCave write — see the note in
            SearchOrganizationForm for why the guard is needed even when the
            user never disconnects mid-flow. */}
        <OfflineDisabled>
          <Button
            disabled={selectedEntrances.length === 0 || !isOnline}
            color="primary"
            variant="contained"
            type="submit"
            onClick={handleOnSubmit}>
            {submitLabel ?? formatMessage({ id: 'Associate' })}
          </Button>
        </OfflineDisabled>
      </Box>
    </Box>
  );
};

SearchCaveForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string
};

export default SearchCaveForm;
