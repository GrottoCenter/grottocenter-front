import { Button, List, ListItem, ListItemText } from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'ramda';
import styled from 'styled-components';
import DownloadIcon from '@material-ui/icons/GetApp';
import GCLink from '../../../common/GCLink';

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
                <Button
                  variant="text"
                  size="small"
                  target="_blank"
                  startIcon={<DownloadIcon />}
                  href={fileLinks[index].href}>
                  {fileName}
                </Button>
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

Files.propTypes = {
  fileNames: PropTypes.arrayOf(PropTypes.string),
  fileLinks: PropTypes.arrayOf(PropTypes.string),
  licenseName: PropTypes.string,
  licenseUrl: PropTypes.string
};

export default Files;
