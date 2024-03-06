import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Translate from '../Translate';
import OrganizationListItem from './OrganizationListItem';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%'
});

const OrganizationsList = props => {
  const { orgas, title, emptyMessageComponent } = props;

  return (
    <>
      {title && (
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>
      )}
      {orgas && orgas.length > 0 ? (
        <StyledList>
          {orgas
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(orga => (
              <OrganizationListItem key={orga.id} orga={orga} />
            ))}
        </StyledList>
      ) : (
        emptyMessageComponent
      )}
    </>
  );
};

OrganizationsList.propTypes = {
  orgas: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node
};

OrganizationsList.defaultProps = {
  orgas: [],
  emptyMessageComponent: <Translate>Empty list</Translate>
};

export default OrganizationsList;
