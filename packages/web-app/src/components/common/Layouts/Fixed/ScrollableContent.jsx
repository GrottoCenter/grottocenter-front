import PropTypes from 'prop-types';
import React from 'react';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';
import {
  Card as MuiCard,
  CardActions,
  CardContent,
  CardHeader as MuiCardHeader,
  IconButton as MuiIconButton,
  Typography
} from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import AnchorCopyButton, { AnchorHeadingWrapper } from '../../AnchorCopyButton';
import { useAnchorScroll } from '../../../../hooks';

const Card = styled(MuiCard)`
  overflow: inherit;
  margin: ${({ theme }) => theme.spacing(2)};
  scroll-margin-top: ${({ theme }) => theme.appBarHeight}px;
`;

const IconButton = styled(MuiIconButton)`
  margin-left: auto;
`;

const Title = styled('div')`
  display: flex;
  justify-content: space-between;
`;

const CardHeader = styled(MuiCardHeader, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
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
  dense = false,
  anchorId
}) => {
  const { formatMessage } = useIntl();
  useAnchorScroll(anchorId);

  return (
    <Card id={anchorId}>
      <CardHeader
        $dense={dense ? 1 : 0}
        title={
          <Title>
            <Typography variant="h2" color="secondary">
              {anchorId ? (
                <AnchorHeadingWrapper>
                  {title}
                  <AnchorCopyButton anchorId={anchorId} />
                </AnchorHeadingWrapper>
              ) : (
                title
              )}
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
            aria-label={formatMessage({ id: 'edit' })}
            disabled={isNil(onEdit)}
            onClick={onEdit}>
            <CreateIcon />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
};

ScrollableContent.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.node,
  onEdit: PropTypes.func,
  content: PropTypes.node.isRequired,
  footer: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  dense: PropTypes.bool,
  anchorId: PropTypes.string
};

Footer.propTypes = {
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
};

export default ScrollableContent;
