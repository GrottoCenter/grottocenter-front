import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@mui/material';
import withStyles from '@mui/styles/withStyles';
import Translate from '../Translate';
import CaveListItem from './CaveListItem';

const StyledList = withStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%'
  }
})(List);

const CavesList = ({
  caves = [],
  title = <Translate>Caves list</Translate>,
  emptyMessageComponent = <Translate>Empty list</Translate>
}) => (
  <div>
    <Typography variant="h3">{title}</Typography>
    {caves && caves.length > 0 ? (
      <StyledList>
        {caves
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(cave => (
            <CaveListItem key={cave.id} cave={cave} />
          ))}
      </StyledList>
    ) : (
      emptyMessageComponent
    )}
  </div>
);

CavesList.propTypes = {
  caves: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node
};

export default CavesList;
