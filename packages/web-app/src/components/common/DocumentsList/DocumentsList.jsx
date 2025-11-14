import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { List, Typography, Divider, Pagination, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
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
  onUnlink,
  itemsPerPage = 10
}) => {
  const [page, setPage] = useState(1);

  const paginatedDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return [];
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return documents.slice(startIndex, endIndex);
  }, [documents, page, itemsPerPage]);

  const totalPages = useMemo(
    () => Math.ceil((documents?.length || 0) / itemsPerPage),
    [documents, itemsPerPage]
  );

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <>
      {title && (
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>
      )}
      {documents && documents.length > 0 ? (
        <>
          <List>
            {paginatedDocuments.map((document, i) => (
              <div key={document.id}>
                <Document
                  document={document}
                  hasSnapshotButton={hasSnapshotButton}
                  onUnlink={onUnlink}
                />
                {paginatedDocuments.length - 1 !== i && (
                  <DividerStyled variant="middle" />
                )}
              </div>
            ))}
          </List>
          {totalPages > 1 && (
            <Box mt={2} display="flex" justifyContent="center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        emptyMessageComponent
      )}
    </>
  );
};

DocumentsList.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.shape(Document.propTypes)),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node,
  hasSnapshotButton: PropTypes.bool,
  onUnlink: PropTypes.func,
  itemsPerPage: PropTypes.number
};

export default DocumentsList;
