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
  padding-left: ${({ theme }) => theme.spacing(1)}px;
  text-decoration: none;
  font-size: smaller;
  color: inherit;
`;

const FileListItem = styled(ListItem)`
  margin: 0;
  & > * {
    margin: 0;
  }
`;

const Files = ({ fileNames, fileLinks, licenseName, licenseUrl }) => {
  return (
    !isEmpty(fileNames) && (
      <List>
        {fileNames.map((fileName, index) => (
          <FileListItem key={`${fileName}`} dense>
            <ListItemText
              primaryTypographyProps={{ display: 'inline' }}
              primary={
                <GCLink
                  internal={false}
                  target="_blank"
                  href={fileLinks[index].href}>
                  {fileName}
                </GCLink>
              }
              secondaryTypographyProps={{ display: 'inline' }}
              secondary={
                <LicenseLink internal={false} target="_blank" href={licenseUrl}>
                  {licenseName}
                </LicenseLink>
              }
            />
          </FileListItem>
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
        secondaryTypographyProps={{ component: 'div' }}
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
            <>
              <Document key={document.id} {...document} />
              {i < documents.length - 1 && (
                <Divider variant="middle" component="li" />
              )}
            </>
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
