import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';
import {
  Card as MuiCard,
  CardActions,
  CardContent,
  CardHeader as MuiCardHeader,
  IconButton as MuiIconButton,
  Tooltip,
  Typography
} from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import copyToClipboard from '../../../../helpers/clipboard';
import CheckIcon from '@mui/icons-material/Check';
import LinkIcon from '@mui/icons-material/Link';

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

const HeadingWrapper = styled('span')`
  & .anchor-link {
    opacity: 0;
    margin-left: 2px;
    padding: 2px;
    color: inherit;
    transition: opacity 0.15s;
    vertical-align: middle;
  }

  &:hover .anchor-link {
    opacity: 1;
  }

  @media (hover: none) {
    & .anchor-link {
      opacity: 1;
    }
  }
`;

const Footer = ({ content }) =>
  typeof content === 'string' ? (
    <Typography variant="caption" align="right">
      content
    </Typography>
  ) : (
    content
  );

const AnchorCopyButton = ({ anchorId }) => {
  const { formatMessage } = useIntl();
  const [copied, setCopied] = useState(false);

  const handleClick = async e => {
    e.preventDefault();
    window.history.replaceState(null, '', `#${anchorId}`);
    await copyToClipboard(window.location.href);
    setCopied(true);
  };

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [copied]);

  return (
    <Tooltip
      title={formatMessage({ id: copied ? 'Link copied!' : 'Copy link' })}>
      <MuiIconButton
        className="anchor-link"
        size="small"
        aria-label={formatMessage({ id: 'Copy link' })}
        onClick={handleClick}>
        {copied ? (
          <CheckIcon fontSize="inherit" />
        ) : (
          <LinkIcon fontSize="inherit" />
        )}
      </MuiIconButton>
    </Tooltip>
  );
};

AnchorCopyButton.propTypes = {
  anchorId: PropTypes.string.isRequired
};

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

  useEffect(() => {
    if (anchorId && window.location.hash.slice(1) === anchorId) {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [anchorId]);

  return (
    <Card id={anchorId}>
      <CardHeader
        $dense={dense ? 1 : 0}
        title={
          <Title>
            <Typography variant="h2" color="secondary">
              {anchorId ? (
                <HeadingWrapper>
                  {title}
                  <AnchorCopyButton anchorId={anchorId} />
                </HeadingWrapper>
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
