import React from 'react';
import PropTypes from 'prop-types';
import { List, Typography, Divider } from '@material-ui/core';
import styled from 'styled-components';
import Document from './Document';

const DividerStyled = styled(Divider)`
  background-color: ${props => props.theme.palette.divider};
  margin: 10px 0px;
`;

const DocumentsList = ({
  documents,
  title,
  emptyMessageComponent,
  hasSnapshotButton = false,
  onUnlink
}) => (
  <>
    {title && (
      <Typography variant="h3" gutterBottom>
        {title}
      </Typography>
    )}
    {documents && documents.length > 0 ? (
      <List>
        {documents.map((document, i) => (
          <div key={document.id}>
            <Document
              document={document}
              hasSnapshotButton={hasSnapshotButton}
              onUnlink={onUnlink}
            />
            {documents.length - 1 !== i && <DividerStyled variant="middle" />}
          </div>
        ))}
      </List>
    ) : (
      emptyMessageComponent
    )}
  </>
);

DocumentsList.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.shape(Document.propTypes)),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node,
  hasSnapshotButton: PropTypes.bool,
  onUnlink: PropTypes.func
};

export default DocumentsList;
