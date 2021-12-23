import { useIntl } from 'react-intl';
import { Chip, Divider, List, ListItem, ListItemText } from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'ramda';
import styled from 'styled-components';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { documentsType, documentType } from './Provider';
import GCLink from '../../common/GCLink';

const StyledListItemText = styled(ListItemText)`
  width: 100%;
  padding-right: ${({ theme }) => theme.spacing(2)}px;
`;

const StyledChip = styled(Chip)`
  margin-left: ${({ theme }) => theme.spacing(2)}px;
  padding: 0 ${({ theme }) => theme.spacing(1)}px;
`;

const LicenseLink = styled(GCLink)`
  text-decoration: none;
  font-size: small;
  color: inherit;
`;

const Files = ({ fileNames, fileLinks, licenseName, licenseUrl }) => {
  return (
    !isEmpty(fileNames) && (
      <List>
        {fileNames.map((fileName, index) => (
          <ListItem key={`${fileName}`} dense>
            <GCLink
              internal={false}
              target="_blank"
              href={fileLinks[index].href}>
              {fileName}
            </GCLink>
            &nbsp;
            <LicenseLink internal={false} target="_blank" href={licenseUrl}>
              {licenseName}
            </LicenseLink>
          </ListItem>
        ))}
      </List>
    )
  );
};

const Document = ({ details, entities, id, overview }) => {
  const { formatMessage } = useIntl();

  return (
    <ListItem>
      <StyledListItemText
        primary={
          <>
            <GCLink
              internal={false}
              target="_blank"
              href={`/ui/documents/${id}`}>
              {overview.title}
            </GCLink>
            <StyledChip
              variant="outlined"
              size="small"
              color="primary"
              label={
                (details.documentType &&
                  formatMessage({
                    id: details.documentType
                  })) ||
                formatMessage({ id: 'unknown' })
              }
            />
          </>
        }
        secondary={
          <Files
            {...entities.files}
            licenseName={overview.license.name}
            licenseUrl={overview.license.url}
          />
        }
      />
    </ListItem>
  );
};

const Documents = ({ documents }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Documents' })}
      content={
        <List>
          {documents.map((document, i) => (
            <div key={document.id}>
              <Document {...document} />
              {i < documents.length - 1 && (
                <Divider variant="middle" component="li" />
              )}
            </div>
          ))}
        </List>
      }
    />
  );
};

Files.propTypes = {
  fileNames: PropTypes.arrayOf(PropTypes.string),
  fileLinks: PropTypes.arrayOf(PropTypes.string),
  licenseName: PropTypes.string,
  licenseUrl: PropTypes.string
};

Document.propTypes = documentType;

Documents.propTypes = {
  documents: documentsType
};

export default Documents;
