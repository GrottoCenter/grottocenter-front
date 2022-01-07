import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Translate from '../Translate';
import EntranceListItem from './EntranceListItem';

const StyledList = withStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%'
  }
})(List);

const EntrancesList = props => {
  const { entrances, title, emptyMessageComponent } = props;

  return (
    <div>
      <Typography variant="h3">{title}</Typography>
      {entrances.length > 0 ? (
        <StyledList>
          {entrances
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(entrance => (
              <EntranceListItem key={entrance.id} entrance={entrance} />
            ))}
        </StyledList>
      ) : (
        <em>{emptyMessageComponent}</em>
      )}
    </div>
  );
};

EntrancesList.propTypes = {
  entrances: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node
};

EntrancesList.defaultProps = {
  entrances: undefined,
  title: <Translate>Entrances list</Translate>,
  emptyMessageComponent: <Translate>Empty list</Translate>
};

export default EntrancesList;
