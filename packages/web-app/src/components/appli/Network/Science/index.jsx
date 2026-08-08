import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Tooltip } from '@mui/material';

import { EntityIcon } from '../../../../pages/EntityCreation/entityConfig';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import Alert from '../../../common/Alert';
import OfflineDisabled from '../../../common/OfflineDisabled';
import { useOnlineStatus } from '../../../../hooks';

const Science = ({ caveId }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const handleImportObservations = () => {
    navigate(`/ui/observations/import?caveId=${caveId}&locked=true`);
  };

  return (
    <ScrollableContent
      dense
      anchorId="science"
      defaultExpanded
      title={formatMessage({ id: 'Science' })}
      icon={
        <Box display="flex" gap={0.5}>
          {/* Not NewEntityButton: this one navigates without the auth gate that
              component applies, and changing that is a separate decision. */}
          <OfflineDisabled>
            <Tooltip
              title={
                isOnline ? formatMessage({ id: 'Import observations' }) : ''
              }>
              <Button
                color="secondary"
                size="small"
                variant="outlined"
                disabled={!isOnline}
                onClick={handleImportObservations}
                startIcon={
                  <EntityIcon iconType="scientific_observation" size={20} />
                }
                data-testid="import-observations-btn">
                {formatMessage({ id: 'New' })}
              </Button>
            </Tooltip>
          </OfflineDisabled>
        </Box>
      }
      content={
        <Alert
          severity="info"
          content={formatMessage({
            id: 'Science data integration in progress.'
          })}
        />
      }
    />
  );
};

Science.propTypes = {
  caveId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

export default Science;
