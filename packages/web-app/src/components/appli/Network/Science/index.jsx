import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';

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
      content={
        <>
          <Alert
            severity="info"
            content={formatMessage({
              id: 'Science data integration in progress.'
            })}
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<FileUploadIcon />}
              onClick={handleImportObservations}
              data-testid="import-observations-btn">
              {formatMessage({ id: 'Import observations' })}
            </Button>
          </Box>
        </>
      }
    />
  );
};

Science.propTypes = {
  caveId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

export default Science;
