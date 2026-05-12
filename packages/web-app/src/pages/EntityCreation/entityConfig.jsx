import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CustomIcon from '../../components/common/CustomIcon';

export const ENTITIES = [
  {
    path: 'entrance',
    iconType: 'entrance',
    titleKey: 'Entrance',
    descriptionKey: 'Add a cave entrance with its location and characteristics'
  },
  {
    path: 'document',
    iconType: 'bibliography',
    titleKey: 'Document',
    descriptionKey:
      'Add an image, topographic drawing, book, dataset, bibliography reference, etc.'
  },
  {
    path: 'massif',
    iconType: 'massif',
    titleKey: 'Massif',
    descriptionKey: 'Add a massif with its geographical boundaries'
  },
  {
    path: 'organization',
    iconType: 'organization',
    titleKey: 'Organization',
    descriptionKey: 'Add a caving club or scientific organization'
  }
];

export const EntityIcon = ({ iconType, size = 35 }) => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CustomIcon type={iconType} size={size} />
    <AddCircleIcon
      sx={{
        position: 'absolute',
        top: -4,
        right: -4,
        fontSize: 16,
        color: 'secondary.main',
        bgcolor: 'background.paper',
        borderRadius: '50%'
      }}
    />
  </Box>
);

EntityIcon.propTypes = {
  iconType: PropTypes.string.isRequired,
  size: PropTypes.number
};
