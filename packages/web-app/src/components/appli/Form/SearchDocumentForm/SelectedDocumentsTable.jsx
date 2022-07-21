import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableCell,
  TableBody,
  TableHead,
  TableRow,
  IconButton
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import DeleteIcon from '@material-ui/icons/Delete';

import Alert from '../../../common/Alert';

const SelectedDocumentsTable = ({ documents, unselectDocument }) => {
  const { formatMessage } = useIntl();

  return documents.length === 0 ? (
    <Alert
      severity="info"
      content={formatMessage({
        id: 'Select document(s) by clicking on the result table above.'
      })}
    />
  ) : (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>{formatMessage({ id: 'Id' })}</TableCell>
          <TableCell>{formatMessage({ id: 'Title' })}</TableCell>
          <TableCell>{formatMessage({ id: 'Unselect document' })}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {documents.map(doc => (
          <TableRow key={doc.id}>
            <TableCell>{doc.id}</TableCell>
            <TableCell>{doc.title}</TableCell>
            <TableCell>
              <IconButton
                size="small"
                color="primary"
                onClick={() => unselectDocument(doc.id)}>
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

SelectedDocumentsTable.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    })
  ),
  unselectDocument: PropTypes.func.isRequired
};

export default SelectedDocumentsTable;
