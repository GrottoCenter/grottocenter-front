import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import EntranceListItem from './EntranceListItem';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%'
});

const EntrancesList = ({ entrances, title, onRemove, showRemove }) => {
  if (!entrances || entrances.length === 0) return null;

  return (
    <>
      {title && (
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>
      )}
      <StyledList>
        {entrances
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(entrance => (
            <EntranceListItem
              key={entrance.id}
              entrance={entrance}
              onRemove={onRemove}
              showRemove={showRemove}
            />
          ))}
      </StyledList>
    </>
  );
};

EntrancesList.propTypes = {
  entrances: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  onRemove: PropTypes.func,
  showRemove: PropTypes.bool
};

export default EntrancesList;
