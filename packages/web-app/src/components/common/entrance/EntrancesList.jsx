import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@mui/material';
import styled from 'styled-components';
import Translate from '../Translate';
import EntranceListItem from './EntranceListItem';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%'
});

const EntrancesList = props => {
  const { entrances, title, emptyMessageComponent } = props;

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {title}
      </Typography>
      {entrances && entrances.length > 0 ? (
        <StyledList>
          {entrances
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(entrance => (
              <EntranceListItem key={entrance.id} entrance={entrance} />
            ))}
        </StyledList>
      ) : (
        emptyMessageComponent
      )}
    </>
  );
};

EntrancesList.propTypes = {
  entrances: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node
};

EntrancesList.defaultProps = {
  entrances: [],
  title: <Translate>Entrances list</Translate>,
  emptyMessageComponent: <Translate>Empty list</Translate>
};

export default EntrancesList;
