import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button } from '@mui/material';

import { ADVANCED_SEARCH_TYPES } from '@/conf/config';
import { useOnlineStatus, resetAdvancedSearch } from '@/hooks';
import OfflineDisabled from '@/components/common/OfflineDisabled';
import Alert from '@/components/common/Alert';
import EntrancesSearch from '../AdvancedSearch/EntrancesSearch';
import SearchResults from '../AdvancedSearch/SearchResults';

const SearchEntranceForm = ({ onSubmit, onSuccess }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const [selectedEntrances, setSelectedEntrances] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    resetAdvancedSearch();
    setSelectedEntrances([]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(selectedEntrances);
      resetForm();
      onSuccess();
    } catch (_error) {
      // Mutation errors are surfaced by the QueryClient's global notifier.
    } finally {
      setIsSubmitting(false);
    }
  };

  const associateMessage =
    selectedEntrances.length === 1
      ? formatMessage({ id: 'Associate 1 entrance' })
      : formatMessage(
          { id: 'Associate {nb} entrances' },
          { nb: selectedEntrances.length }
        );

  return (
    <Box textAlign="center">
      <EntrancesSearch />
      <SearchResults
        entityType={ADVANCED_SEARCH_TYPES.ENTRANCES}
        hideExport
        onSelected={(ids, results) => {
          const resultIds = results.map(entrance => entrance.id);
          setSelectedEntrances(previous => [
            ...previous.filter(entrance => !resultIds.includes(entrance.id)),
            ...results.filter(entrance => ids.includes(entrance.id))
          ]);
        }}
      />
      {selectedEntrances.length === 0 && (
        <Alert
          severity="info"
          content={formatMessage({
            id: 'Select entrances with the checkboxes to associate them.'
          })}
        />
      )}
      <Box sx={{ my: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
        <Button variant="outlined" disabled={isSubmitting} onClick={resetForm}>
          {formatMessage({ id: 'Reset' })}
        </Button>
        <OfflineDisabled>
          <Button
            disabled={
              selectedEntrances.length === 0 || !isOnline || isSubmitting
            }
            color="primary"
            onClick={handleSubmit}>
            {associateMessage}
          </Button>
        </OfflineDisabled>
      </Box>
    </Box>
  );
};

SearchEntranceForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default SearchEntranceForm;
