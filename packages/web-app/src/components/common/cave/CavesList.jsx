import React from 'react';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { List, Typography } from '@mui/material';
import Translate from '../Translate';
import CaveListItem from './CaveListItem';

const PREFIX = 'CavesList';

const classes = {
  root: `${PREFIX}-root`
};

const StyledTranslate = styled(Translate)({
  [`& .${classes.root}`]: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%'
  }
});

const StyledList = List;

const CavesList = props => {
  const { caves, title, emptyMessageComponent } = props;

  return (
    <div>
      <Typography variant="h3">{title}</Typography>
      {caves && caves.length > 0 ? (
        <StyledList
          classes={{
            root: classes.root
          }}>
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
};

CavesList.propTypes = {
  caves: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node
};

CavesList.defaultProps = {
  caves: [],
  title: <StyledTranslate>Caves list</StyledTranslate>,
  emptyMessageComponent: <Translate>Empty list</Translate>
};

export default CavesList;
