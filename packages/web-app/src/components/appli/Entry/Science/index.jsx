import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Tooltip } from '@mui/material';

import { EntityIcon } from '../../../../pages/EntityCreation/entityConfig';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import Alert from '../../../common/Alert';

const Science = ({ caveId }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

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
          <Tooltip title={formatMessage({ id: 'Import observations' })}>
            <Button
              color="secondary"
              size="small"
              variant="outlined"
              onClick={handleImportObservations}
              startIcon={
                <EntityIcon iconType="scientific_observation" size={20} />
              }
              data-testid="import-observations-btn">
              {formatMessage({ id: 'New' })}
            </Button>
          </Tooltip>
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
