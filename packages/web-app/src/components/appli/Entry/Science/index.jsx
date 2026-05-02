import React from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  Card,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import PestControlIcon from '@mui/icons-material/PestControl';

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

const Science = () => {
  const { formatMessage } = useIntl();

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
            content="Données scientifiques en cours d'intégration. Seul le comptage de chauves-souris est disponible à titre indicatif."
          />

          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ px: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
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

export default Science;
