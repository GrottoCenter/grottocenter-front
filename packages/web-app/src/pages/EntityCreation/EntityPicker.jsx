import React from 'react';
import { useIntl } from 'react-intl';
import { Box, Card, CardContent, Typography } from '@mui/material';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import AppLink from '../../components/common/AppLink';
import { ENTITIES, EntityIcon } from './entityConfig';

const EntityPicker = () => {
  const { formatMessage } = useIntl();

  return (
    <Layout
      title={formatMessage({ id: 'Add a new entity in Grottocenter' })}
      content={
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mt: 0.5
          }}>
          {ENTITIES.map(({ path, iconType, titleKey, descriptionKey }) => (
            <Card
              key={path}
              component={AppLink}
              to={path}
              variant="outlined"
              sx={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px'
                }
              }}
              // iOS keeps :focus style after tap; blur on touchEnd removes the stale focus ring
              onTouchEnd={e => e.currentTarget.blur()}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <EntityIcon iconType={iconType} />
                  <Typography variant="h6" fontWeight={600}>
                    {formatMessage({ id: titleKey })}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {formatMessage(descriptionKey)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      }
    />
  );
};

export default EntityPicker;
