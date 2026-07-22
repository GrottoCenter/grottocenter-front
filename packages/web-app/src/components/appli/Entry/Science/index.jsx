import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import PestControlIcon from '@mui/icons-material/PestControl';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import Alert from '../../../common/Alert';

const BAT_COUNTS_PLACEHOLDER = [
  {
    id: 1,
    species: 'Rhinolophus ferrumequinum',
    count: 47,
    date: '2024-02-15',
    observer: 'M. Dupont'
  },
  {
    id: 2,
    species: 'Myotis myotis',
    count: 12,
    date: '2024-02-15',
    observer: 'M. Dupont'
  },
  {
    id: 3,
    species: 'Rhinolophus hipposideros',
    count: 8,
    date: '2023-11-30',
    observer: 'S. Martin'
  }
];

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

          <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<FileUploadIcon />}
              onClick={handleImportObservations}
              data-testid="import-observations-btn">
              {formatMessage({ id: 'Import observations' })}
            </Button>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ px: 0.5, mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <PestControlIcon fontSize="small" />
              {formatMessage({ id: 'Bat counting' })}
            </Typography>

            <Card variant="outlined">
              <List dense disablePadding>
                {BAT_COUNTS_PLACEHOLDER.map((entry, index) => (
                  <React.Fragment key={entry.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box
                            sx={{ display: 'flex', justifyContent: 'space-between' }}
                          >
                            <Typography variant="body2" fontStyle="italic">
                              {entry.species}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {entry.count} ind.
                            </Typography>
                          </Box>
                        }
                        secondary={`${entry.date} — ${entry.observer}`}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Card>
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
