import { Button, ListItem, ListItemText } from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Description } from '@material-ui/icons';

const FileListItem = styled(ListItem)`
  margin: 0;
  & > * {
    margin: 0;
  }
  padding: 0;
`;

const Files = ({ files }) => {
  if (files.length === 0) return false;

  return files.map(file => (
    <FileListItem key={`${file.fileName}`} dense component="div">
      <ListItemText
        primaryTypographyProps={{ display: 'inline' }}
        primary={
          <Button
            variant="text"
            size="small"
            target="_blank"
            startIcon={<Description />}
            href={file.completePath}>
            {file.fileName}
          </Button>
        }
      />
    </FileListItem>
  ));
};

Files.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string,
      completePath: PropTypes.string
    })
  )
};

export default Files;
