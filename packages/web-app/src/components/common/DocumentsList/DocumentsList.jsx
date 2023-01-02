import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@mui/material';
import styled from 'styled-components';
import Translate from '../Translate';
import DocumentListItem from './DocumentListItem';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%'
});

const DocumentsList = props => {
  const { docs, title, emptyMessageComponent } = props;

  return (
    <>
      {title && (
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>
      )}
      {docs && docs.length > 0 ? (
        <StyledList>
          {docs
            .sort((a, b) => a.title.localeCompare(b.title))
            .map(doc => (
              <DocumentListItem key={doc.id} doc={doc} />
            ))}
        </StyledList>
      ) : (
        emptyMessageComponent
      )}
    </>
  );
};

DocumentsList.propTypes = {
  docs: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node
};

DocumentsList.defaultProps = {
  docs: [],
  emptyMessageComponent: <Translate>Empty list</Translate>
};

export default DocumentsList;
