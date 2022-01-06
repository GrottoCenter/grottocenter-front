import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Translate from '../Translate';
import CaveListItem from './CaveListItem';

const StyledList = withStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%'
  }
})(List);

const CavesList = props => {
  const { caves, title, emptyMessageComponent } = props;

  return (
    <div>
      <Typography>{title}</Typography>
      {caves.length > 0 ? (
        <StyledList>
          {caves
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(cave => (
              <CaveListItem key={cave.id} cave={cave} />
            ))}
        </StyledList>
      ) : (
        <>
          <br />
          <em>{emptyMessageComponent}</em>
        </>
      )}
    </div>
  );
};

CavesList.propTypes = {
  caves: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node
};

CavesList.defaultProps = {
  caves: undefined,
  title: (
    <strong>
      <Translate>Caves list</Translate>
    </strong>
  ),
  emptyMessageComponent: <Translate>Empty list</Translate>
};

export default CavesList;
