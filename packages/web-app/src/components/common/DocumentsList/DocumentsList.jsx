import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Translate from '../Translate';
import DocumentListItem from './DocumentListItem';

const StyledList = withStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%'
  }
})(List);

const DocumentsList = props => {
  const { docs, title, emptyMessageComponent } = props;

  return (
    <div>
      {title && <Typography variant="h3">{title}</Typography>}
      {docs && docs.length > 0 ? (
        <StyledList>
          {docs
            .sort((a, b) => a.title.localeCompare(b.title))
            .map(doc => (
              <DocumentListItem key={doc.id} doc={doc} />
            ))}
        </StyledList>
      ) : (
        <em>{emptyMessageComponent}</em>
      )}
    </div>
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
