import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { isNil } from 'ramda';
import {
  Card as MuiCard,
  CardActions,
  CardContent,
  CardHeader as MuiCardHeader,
  IconButton as MuiIconButton,
  Typography
} from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';

const Card = styled(MuiCard)`
  overflow: inherit;
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const IconButton = styled(MuiIconButton)`
  margin-left: auto;
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CardHeader = styled(MuiCardHeader)`
  ${({ $dense }) => $dense && `padding-bottom: 0px`}
`;

const Footer = ({ content }) =>
  typeof content === 'string' ? (
    <Typography variant="caption" align="right">
      content
    </Typography>
  ) : (
    content
  );

const ScrollableContent = ({
  title,
  icon,
  onEdit,
  content,
  footer,
  dense = false
}) => (
  <Card>
    <CardHeader
      $dense={dense}
      title={
        <Title>
          <Typography variant="h2" color="secondary">
            {title}
          </Typography>
          {!isNil(icon) && icon}
        </Title>
      }
    />
    <CardContent>{content}</CardContent>
    {!isNil(footer) && (
      <CardActions disableSpacing>
        <Footer content={footer} />
        <IconButton
          size="small"
          aria-label="edit"
          disabled={isNil(onEdit)}
          onClick={onEdit}>
          <CreateIcon />
        </IconButton>
      </CardActions>
    )}
  </Card>
);

ScrollableContent.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.node,
  onEdit: PropTypes.func,
  content: PropTypes.node.isRequired,
  footer: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  dense: PropTypes.bool
};

Footer.propTypes = {
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
};

export default ScrollableContent;
