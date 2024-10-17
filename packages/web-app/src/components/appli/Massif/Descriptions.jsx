import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Typography,
  Divider,
  ListItem,
  List,
  ListItemText,
  Box
} from '@mui/material';
import Contribution from '../../common/Contribution/Contribution';
import { DescriptionPropTypes } from '../../../types/description.type';

const Descriptions = ({ descriptions }) => {
  const { formatMessage } = useIntl();

  return (
    <Box display="block">
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'Descriptions' })}
      </Typography>
      <List>
        {descriptions.map(description => (
          <div key={description.id}>
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="h4">{description.title}</Typography>
                }
                secondary={
                  <Contribution
                    body={description.body}
                    author={description.author}
                    reviewer={description.reviewer}
                    dateInscription={description.dateInscription}
                    dateReviewed={description.dateReviewed}
                  />
                }
              />
            </ListItem>
            <Divider variant="middle" component="li" />
          </div>
        ))}
      </List>
    </Box>
  );
};

Descriptions.propTypes = {
  descriptions: PropTypes.arrayOf(DescriptionPropTypes)
};

export default Descriptions;
