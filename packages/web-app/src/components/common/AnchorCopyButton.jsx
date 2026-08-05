import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import LinkIcon from '@mui/icons-material/Link';
import copyToClipboard from '../../helpers/clipboard';

export const AnchorHeadingWrapper = styled('span')`
  & .anchor-link {
    opacity: 0;
    margin-left: 2px;
    padding: 2px;
    color: inherit;
    transition: opacity 0.15s;
    vertical-align: middle;
    /* The icon is fontSize="inherit", so without this it scales with the
       heading it sits in (24px in an h2) and the button grows taller than the
       text line, stretching the whole card header. */
    font-size: 1rem;
    line-height: 1;
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

const AnchorCopyButton = ({ anchorId }) => {
  const { formatMessage } = useIntl();
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(
    async e => {
      e.preventDefault();
      window.history.replaceState(null, '', `#${anchorId}`);
      await copyToClipboard(window.location.href);
      setCopied(true);
    },
    [anchorId]
  );

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
      <IconButton
        className="anchor-link"
        size="small"
        aria-label={formatMessage({ id: 'Copy link' })}
        onClick={handleClick}>
        {copied ? (
          <CheckIcon fontSize="inherit" />
        ) : (
          <LinkIcon fontSize="inherit" />
        )}
      </IconButton>
    </Tooltip>
  );
};

AnchorCopyButton.propTypes = {
  anchorId: PropTypes.string.isRequired
};

export default AnchorCopyButton;
