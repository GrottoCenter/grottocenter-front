import React from 'react';
import {
  IconButton,
  ListSubheader,
  List,
  ListItem,
  InputAdornment,
  Typography
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import DeleteIcon from '@material-ui/icons/Delete';
import UndoIcon from '@material-ui/icons/Undo';
import StringInput from '../Form/StringInput';
import { IS_DELETED } from './FileHelpers';

const FilesList = ({ files, updateFileName, removeFile, undoRemove }) => {
  const { formatMessage } = useIntl();

  const isFileDeleted = file => file.state === IS_DELETED;

  return (
    <List
      disablePadding
      subheader={
        <ListSubheader disableGutters>
          {formatMessage({ id: 'Files list' })}
        </ListSubheader>
      }>
      {files.map((file, index) => {
        const isDeleted = isFileDeleted(file);
        return (
          // eslint-disable-next-line react/no-array-index-key
          <ListItem key={index} style={isDeleted ? { opacity: 0.4 } : {}}>
            <StringInput
              required
              value={file.name}
              valueName={formatMessage({ id: 'Name' })}
              onValueChange={updateFileName(index)}
              disabled={isDeleted}
              endAdornment={
                <InputAdornment position="end">
                  <Typography color="textSecondary">
                    .{file.extension}
                  </Typography>
                </InputAdornment>
              }
            />
            {isDeleted ? (
              <IconButton onClick={() => undoRemove(index)}>
                <UndoIcon color="secondary" />
              </IconButton>
            ) : (
              <IconButton onClick={() => removeFile(index)}>
                <DeleteIcon color="error" />
              </IconButton>
            )}
          </ListItem>
        );
      })}
    </List>
  );
};

FilesList.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      extension: PropTypes.string,
      state: PropTypes.string
    })
  ).isRequired,
  updateFileName: PropTypes.func.isRequired,
  removeFile: PropTypes.func.isRequired,
  undoRemove: PropTypes.func.isRequired
};

export default FilesList;
