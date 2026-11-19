import { Box } from '@mui/material';
import ZoomIn from '@mui/icons-material/ZoomIn';
import ZoomOut from '@mui/icons-material/ZoomOut';
import CenterFocusStrong from '@mui/icons-material/CenterFocusStrong';
import { useIntl } from 'react-intl';
import { PreviewControls, PreviewControlButton } from './index';

const ControlsStory = () => {
  const { formatMessage } = useIntl();
  return (
    <Box sx={{ position: 'relative', height: 200, bgcolor: 'grey.100' }}>
      <PreviewControls role="group" aria-label={formatMessage({ id: 'Image' })}>
        <PreviewControlButton
          label={formatMessage({ id: 'Zoom in' })}
          testId="preview-zoom-in"
          onClick={() => {}}>
          <ZoomIn />
        </PreviewControlButton>
        <PreviewControlButton
          label={formatMessage({ id: 'Zoom out' })}
          testId="preview-zoom-out"
          onClick={() => {}}>
          <ZoomOut />
        </PreviewControlButton>
        <PreviewControlButton
          label={formatMessage({ id: 'Reset' })}
          testId="preview-reset"
          onClick={() => {}}>
          <CenterFocusStrong />
        </PreviewControlButton>
      </PreviewControls>
    </Box>
  );
};

export default {
  title: 'Common/MediaPreviewControls',
  component: PreviewControls
};

export const Default = { render: ControlsStory };
