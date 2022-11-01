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
} from '@material-ui/core';
import Contribution from '../../common/Contribution/Contribution';
import authorType from '../../../types/author.type';

const Descriptions = ({ descriptions }) => {
  const { formatMessage } = useIntl();

  return (
    <Box display="block">
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'Descriptions' })}
      </Typography>
      <List>
        {descriptions.map(({ id, title, body, author, date }) => (
          <div key={id}>
            <ListItem>
              <ListItemText
                primary={<Typography variant="h4">{title}</Typography>}
                secondary={
                  <Contribution
                    author={author}
                    body={body}
                    creationDate={date}
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
  descriptions: PropTypes.arrayOf(
    PropTypes.shape({
      author: authorType,
      body: PropTypes.string,
      date: PropTypes.instanceOf(Date),
      id: PropTypes.number,
      language: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    })
  )
};

export default Descriptions;
