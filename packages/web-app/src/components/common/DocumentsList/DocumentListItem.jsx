import React from 'react';
import PropTypes from 'prop-types';
import { ListItem, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

const DocumentListItem = ({ doc }) => {
  const date = new Date(doc.dateInscription);
  return (
    <StyledListItem
      button
      component={React.forwardRef((props, ref) => (
        <Link {...props} to={`/ui/documents/${doc.id}`} ref={ref} />
      ))}>
      <ListItemText
        primary={`${doc.title} - ${date.toLocaleDateString('fr-FR')}`}
        primaryTypographyProps={{ style: { whiteSpace: 'normal' } }} // Multiple lines text
      />
    </StyledListItem>
  );
};

DocumentListItem.propTypes = {
  doc: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    dateInscription: PropTypes.string.isRequired
  })
};
DocumentListItem.defaultProps = {
  doc: undefined
};

export default DocumentListItem;
