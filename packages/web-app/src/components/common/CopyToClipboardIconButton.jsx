import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import copyToClipboard from '@/utils/clipboard';

const VisuallyHidden = styled('span')({
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1
});

const CopyToClipboardIconButton = ({
  value,
  label,
  successLabel,
  errorLabel,
  compact = false
}) => {
  const [copyStatus, setCopyStatus] = useState(null);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!copyStatus) return undefined;
    const timeout = setTimeout(() => setCopyStatus(null), 2000);
    return () => clearTimeout(timeout);
  }, [copyStatus]);

  const handleCopy = () => {
    if (isCopying) return;
    setIsCopying(true);
    copyToClipboard(value)
      .then(
        () => setCopyStatus('success'),
        () => setCopyStatus('error')
      )
      .finally(() => setIsCopying(false));
  };

  let currentLabel = label;
  let icon = <ContentCopyIcon fontSize="small" />;
  if (copyStatus === 'success') {
    currentLabel = successLabel;
    icon = <CheckIcon color="success" fontSize="small" />;
  } else if (copyStatus === 'error') {
    currentLabel = errorLabel;
    icon = <ErrorOutlineIcon color="error" fontSize="small" />;
  }

  return (
    <>
      <Tooltip title={currentLabel}>
        <span>
          <IconButton
            size="small"
            aria-label={currentLabel}
            disabled={isCopying}
            onClick={handleCopy}
            sx={{
              verticalAlign: 'text-bottom',
              ...(compact && {
                width: 20,
                height: 20,
                p: 0,
                '& .MuiSvgIcon-root': { fontSize: '1rem' }
              })
            }}>
            {icon}
          </IconButton>
        </span>
      </Tooltip>
      <VisuallyHidden aria-live="polite">
        {copyStatus && currentLabel}
      </VisuallyHidden>
    </>
  );
};

CopyToClipboardIconButton.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  successLabel: PropTypes.string.isRequired,
  errorLabel: PropTypes.string.isRequired,
  compact: PropTypes.bool
};

export default CopyToClipboardIconButton;
