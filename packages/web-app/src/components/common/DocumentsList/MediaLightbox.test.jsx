import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import messages from '@/../public/lang/en.json';
import MediaLightbox from './MediaLightbox';
import * as imageUtils from './utils/imageUtils';

const media = [
  { fileName: 'plan.png', completePath: '/plan.png' },
  {
    fileName: 'cave.webm',
    completePath: '/cave.webm',
    documentTitle: 'Cave video',
    description: 'Video description'
  },
  { fileName: 'second.mp4', completePath: '/second.mp4' }
];

const viewer = (open = true) => (
  <IntlProvider locale="en" messages={messages}>
    <MemoryRouter>
      <MediaLightbox media={media} open={open} onClose={() => {}} />
    </MemoryRouter>
  </IntlProvider>
);

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Mixed media lightbox', () => {
  it('restores the video source after StrictMode replays its cleanup', () => {
    const { rerender } = render(<StrictMode>{viewer()}</StrictMode>);
    fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
    const video = screen.getByTestId('video-preview');
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(video).toHaveAttribute('src', '/cave.webm');
    rerender(<StrictMode>{viewer(false)}</StrictMode>);
    expect(video).not.toHaveAttribute('src');
  });

  it('labels the caption action for its current state across images and videos', () => {
    render(viewer());
    const hideButton = screen.getByRole('button', {
      name: 'Hide media caption'
    });
    expect(hideButton).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(hideButton);
    expect(
      screen.getByRole('button', { name: 'Show media caption' })
    ).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show media caption' }));
    expect(
      screen.getByRole('button', { name: 'Hide media caption' })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('loads only the active medium and releases videos on navigation and closure', () => {
    const download = vi.spyOn(imageUtils, 'downloadFile').mockResolvedValue();
    const { container, rerender } = render(viewer());
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
      'src',
      '/plan.png'
    );
    expect(container.querySelector('video')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
    const video = screen.getByTestId('video-preview');
    expect(video).toHaveAttribute('src', '/cave.webm');
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('playsinline');
    expect(video).not.toHaveAttribute('autoplay');
    expect(screen.queryByTestId('lightbox-image')).toBeNull();
    expect(screen.getByText('Video description')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(download).toHaveBeenCalledWith('/cave.webm', 'cave.webm');
    expect(screen.queryByRole('progressbar')).toBeNull();

    fireEvent.wheel(video, { deltaY: -100 });
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).toBeNull();
    fireEvent.keyDown(video, { key: 'ArrowRight' });
    expect(video).toHaveAttribute('src', '/cave.webm');

    fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(video).not.toHaveAttribute('src');
    const nextVideo = screen.getByTestId('video-preview');
    expect(nextVideo).toHaveAttribute('src', '/second.mp4');
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(download).toHaveBeenLastCalledWith('/second.mp4', 'second.mp4');
    rerender(viewer(false));
    expect(nextVideo).not.toHaveAttribute('src');
    expect(screen.queryByTestId('video-preview')).toBeNull();
  });

  it('shows an original-file fallback on playback failure and resets it for the next video', () => {
    const download = vi.spyOn(imageUtils, 'downloadFile').mockResolvedValue();
    render(viewer());
    fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
    const video = screen.getByTestId('video-preview');
    fireEvent.error(video);
    expect(screen.getByRole('status')).toHaveTextContent(
      'This video cannot be played in your browser.'
    );
    expect(
      screen.getByRole('link', { name: 'Open the original file' })
    ).toHaveAttribute('href', '/cave.webm');
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(download).toHaveBeenCalledWith('/cave.webm', 'cave.webm');
    expect(video).not.toHaveAttribute('src');
    fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByTestId('video-preview')).toHaveAttribute(
      'src',
      '/second.mp4'
    );
  });
});
