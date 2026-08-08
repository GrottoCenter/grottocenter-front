import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import { Box } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CustomIcon from '../../components/common/CustomIcon';

const descriptions = defineMessages({
  entrance: { id: 'Add a cave entrance with its location and characteristics' },
  document: {
    id: 'Add an image, topographic drawing, book, dataset, bibliography reference, etc.'
  },
  massif: { id: 'Add a massif with its geographical boundaries' },
  organization: { id: 'Add a caving club or scientific organization' },
  importObservations: {
    id: 'Import scientific observations from a CSV file produced by a data logger'
  }
});

export const ENTITIES = [
  {
    path: 'entrance',
    iconType: 'entrance',
    titleKey: 'Entrance',
    descriptionKey: descriptions.entrance
  },
  {
    path: 'document',
    iconType: 'bibliography',
    titleKey: 'Document',
    descriptionKey: descriptions.document
  },
  {
    path: 'massif',
    iconType: 'massif',
    titleKey: 'Massif',
    descriptionKey: descriptions.massif
  },
  {
    path: 'organization',
    iconType: 'organization',
    titleKey: 'Organization',
    descriptionKey: descriptions.organization
  },
  {
    path: '/ui/observations/import',
    iconType: 'scientific_observation',
    titleKey: 'Scientific observations',
    descriptionKey: descriptions.importObservations
  }
];

export const EntityIcon = ({
  iconType,
  size = 35,
  BadgeIcon = AddCircleIcon
}) => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CustomIcon type={iconType} size={size} />
    <BadgeIcon
      sx={theme => ({
        position: 'absolute',
        top: -4,
        right: -4,
        fontSize: 16,
        color: 'secondary.main',
        bgcolor: 'background.paper',
        borderRadius: '50%',
        // The badge pins its own colour, so MUI's disabled text colour never
        // reaches it either. Sibling of CustomIcon's own rule, not a parent of
        // it, so the two can't compound into a double-faded icon.
        //
        // Dimmed by COLOUR only — never `opacity`. The badge sits on top of the
        // entity icon and relies on its own opaque disc to mask it; fading that
        // disc lets the icon show straight through the badge, which is exactly
        // what it exists to prevent. The glyph colour alone carries "disabled".
        '.Mui-disabled &': {
          color: theme.palette.action.disabled
        }
      })}
    />
  </Box>
);

EntityIcon.propTypes = {
  BadgeIcon: PropTypes.elementType,
  iconType: PropTypes.string.isRequired,
  size: PropTypes.number
};
