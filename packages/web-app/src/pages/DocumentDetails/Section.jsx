import {
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Description } from '@mui/icons-material';

import GCLink from '../../components/common/GCLink';

const Label = styled(Typography)`
  margin-right: ${({ theme }) => theme.spacing(2)};
  text-transform: uppercase;
`;
const IconAndLabelWrapper = styled('span')`
  text-align: right;
`;

export const SectionDivider = styled(Divider)`
  margin-top: 1em;
  margin-bottom: 1em;
  background-color: ${props => props.theme.palette.divider};
`;

export const ItemString = ({ label, value, url }) => {
  if (!value) return false;
  return (
    <>
      <IconAndLabelWrapper>
        <Label color="textSecondary" variant="caption">
          {`${label}: `}
          &nbsp;
        </Label>
      </IconAndLabelWrapper>
      {url ? (
        <GCLink href={url} internal={url.startsWith('/ui')}>
          {value}
        </GCLink>
      ) : (
        <Typography component="span">{value}</Typography>
      )}
    </>
  );
};
ItemString.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  url: PropTypes.string
};

export const ItemList = ({ label, children }) => {
  if (!children || children.length === 0) return false;
  return (
    <>
      <IconAndLabelWrapper>
        <Label color="textSecondary" variant="caption">
          {`${label}: `}
          &nbsp;
        </Label>
      </IconAndLabelWrapper>
      <List>{children}</List>
    </>
  );
};
ItemList.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node
};

export const ListElement = ({ icon, value, secondary, url }) => {
  if (!value) return false;
  return (
    <ListItem>
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
      <ListItemText
        primary={<TextLink value={value} url={url} />}
        secondary={secondary}
      />
    </ListItem>
  );
};
ListElement.propTypes = {
  icon: PropTypes.node,
  value: PropTypes.string,
  secondary: PropTypes.string,
  url: PropTypes.string
};

export const TextLink = ({ value, url }) =>
  url ? (
    <GCLink href={url} internal={url.startsWith('/ui')}>
      {value}
    </GCLink>
  ) : (
    <Typography>{value}</Typography>
  );
TextLink.propTypes = {
  value: PropTypes.string.isRequired,
  url: PropTypes.node
};

export const SectionTitle = ({ children }) => (
  <Typography color="textSecondary" variant="h6" gutterBottom>
    {children}
  </Typography>
);
SectionTitle.propTypes = {
  children: PropTypes.node
};

export const SectionTitleLink = ({ title, value, url }) => {
  if (!value) return false;

  return (
    <Typography variant="body1" paragraph>
      {title} <TextLink value={value} url={url} />
    </Typography>
  );
};
SectionTitleLink.propTypes = {
  title: PropTypes.string,
  value: PropTypes.string,
  url: PropTypes.string
};

const SectionTextContainer = styled(Typography)`
  white-space: pre-wrap;
`;
export const SectionText = ({ title, children }) => {
  if (!children || children.length === 0) return false;
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <SectionTextContainer paragraph>{children}</SectionTextContainer>
    </>
  );
};
SectionText.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node
};

const SectionDetailsContainer = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  row-gap: 10px;
`;
export const SectionDetails = ({ title, children }) => {
  if (!children || children.length === 0) return false;
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <SectionDetailsContainer>{children}</SectionDetailsContainer>
      <SectionDivider light />
    </>
  );
};
SectionDetails.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node
};

const SectionListContainer = styled(List)`
  & .MuiListItem-root {
    width: initial;
  }

  & .MuiListItemText-secondary {
    white-space: pre-wrap;
  }

  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
`;
export const SectionList = ({ title, children }) => {
  if (!children || children.length === 0) return false;
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <SectionListContainer>{children}</SectionListContainer>
    </>
  );
};
SectionList.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node
};

const SectionFilesPreviewIfFrame = styled('iframe')`
  border: 0;
  width: 100%;
  min-height: 500px;
`;
export const SectionFilesPreview = ({ title, files }) => {
  const PREVIEW_EXTENTIONS = ['.pdf', '.png', '.jpg', '.mp3', '.mp4'];
  const getExtention = url => `.${url.split('.').pop().toLowerCase()}`;
  if (!files || files.length === 0) return false;
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      {files.map(e => (
        <Fragment key={e.completePath}>
          <ListElement
            key={e.completePath}
            icon={<Description color="primary" />}
            value={e.fileName}
            url={e.completePath}
          />
          {PREVIEW_EXTENTIONS.includes(getExtention(e.completePath)) && (
            <SectionFilesPreviewIfFrame src={e.completePath} />
          )}
        </Fragment>
      ))}
    </>
  );
};
SectionFilesPreview.propTypes = {
  title: PropTypes.string,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string,
      completePath: PropTypes.string
    })
  )
};
