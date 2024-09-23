import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import OrganizationListItem from './OrganizationListItem';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%'
});

const OrganizationsList = ({ orgas, title }) => {
  if (!orgas || orgas.length === 0) return false;
  return (
    <>
      {title && (
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>
      )}
      <StyledList>
        {orgas
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(orga => (
            <OrganizationListItem key={orga.id} orga={orga} />
          ))}
      </StyledList>
      <hr />
    </>
  );
};

OrganizationsList.propTypes = {
  orgas: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node
};

export default OrganizationsList;
