import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Translate from '../Translate';
import OrganizationListItem from './OrganizationListItem';

const StyledList = withStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%'
  }
})(List);

const OrganizationsList = props => {
  const { orgas, title, emptyMessageComponent } = props;

  return (
    <div>
      {title && <Typography variant="h3">{title}</Typography>}
      {orgas && orgas.length > 0 ? (
        <StyledList>
          {orgas
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(orga => (
              <OrganizationListItem key={orga.id} orga={orga} />
            ))}
        </StyledList>
      ) : (
        <em>{emptyMessageComponent}</em>
      )}
    </div>
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
