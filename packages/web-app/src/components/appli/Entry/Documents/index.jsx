import { useIntl } from 'react-intl';
import { Divider, List } from '@material-ui/core';
import React from 'react';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { documentsType } from '../Provider';

import Document from './Document';

const Documents = ({ documents }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Documents' })}
      content={
        <List>
          {documents.map((document, i) => (
            <span key={document.id}>
              <Document {...document} />
              {i < documents.length - 1 && (
                <Divider variant="middle" component="li" />
              )}
            </span>
          ))}
        </List>
      }
    />
  );
};

Documents.propTypes = {
  documents: documentsType
};

export default Documents;
