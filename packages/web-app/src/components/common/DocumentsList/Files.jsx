import { Button, ListItem, ListItemText } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Description } from '@mui/icons-material';

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
