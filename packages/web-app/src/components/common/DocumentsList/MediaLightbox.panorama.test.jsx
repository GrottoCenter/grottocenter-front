import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import { createPanoramaViewer } from '@/components/common/PanoramaPreview/pannellum';
import MediaLightbox from './MediaLightbox';

vi.mock('@/components/common/PanoramaPreview/pannellum', () => ({
  createPanoramaViewer: vi.fn()
}));

const media = [
  { fileName: 'sphere.jpg', completePath: '/sphere.jpg' },
  { fileName: 'flat.jpg', completePath: '/flat.jpg' },
  { fileName: 'video.mp4', completePath: '/video.mp4' }
];

const lightbox = (open = true) => (
  <IntlProvider locale="en" messages={messages}>
    <MediaLightbox open={open} onClose={() => {}} media={media} />
  </IntlProvider>
);

let viewers;
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  viewers = [];
  createPanoramaViewer.mockImplementation(() => {
    const events = {};
    const viewer = {
      on: vi.fn((name, callback) => {
        events[name] = callback;
      }),
      off: vi.fn(),
      destroy: vi.fn(),
      getHfov: vi.fn(() => 100),
      setHfov: vi.fn(),
      lookAt: vi.fn(),
      events
    };
    viewers.push(viewer);
    return viewer;
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const activate = async () => {
  fireEvent.click(screen.getByTestId('panorama-mode-spherical'));
  await waitFor(() => expect(createPanoramaViewer).toHaveBeenCalled());
  return viewers.at(-1);
};

it('loads the panorama engine only on request and passes the original image', async () => {
  render(lightbox());
  expect(createPanoramaViewer).not.toHaveBeenCalled();
  expect(screen.getByTestId('panorama-mode-flat')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  const viewer = await activate();
  expect(createPanoramaViewer.mock.calls[0][1]).toMatchObject({
    panorama: '/sphere.jpg',
    type: 'equirectangular',
    autoLoad: true,
    showControls: false
  });
  expect(screen.queryByTestId('lightbox-image')).not.toBeInTheDocument();
  act(() => viewer.events.load());
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(viewer.setHfov).toHaveBeenCalledWith(90);
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(viewer.lookAt).toHaveBeenCalledWith(0, 0, 100, false);

  fireEvent.click(screen.getByTestId('panorama-mode-flat'));
  expect(viewer.destroy).toHaveBeenCalledOnce();
  expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
    'src',
    '/sphere.jpg'
  );
});

it('gives gestures and arrow keys to the panorama and resets mode on navigation', async () => {
  render(lightbox());
  const viewer = await activate();
  act(() => viewer.events.load());
  fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' });
  fireEvent.wheel(screen.getByRole('region'), { deltaY: -100 });
  expect(screen.getByTestId('panorama-preview')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Reset zoom' })
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
  expect(viewer.destroy).toHaveBeenCalledOnce();
  expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
    'src',
    '/flat.jpg'
  );
  expect(screen.getByTestId('panorama-mode-flat')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
  expect(
    screen.queryByTestId('panorama-mode-controls')
  ).not.toBeInTheDocument();
});

it('allows retry or flat mode after an error and releases a pending viewer on close', async () => {
  const { rerender } = render(lightbox());
  const viewer = await activate();
  act(() => viewer.events.error());
  expect(screen.getByRole('alert')).toHaveTextContent(
    messages['panorama.error']
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(viewers).toHaveLength(2));
  expect(viewer.destroy).toHaveBeenCalledOnce();
  rerender(lightbox(false));
  expect(viewers[1].destroy).toHaveBeenCalledOnce();
  act(() => viewers[1].events.load());
  expect(viewers[1].destroy).toHaveBeenCalledTimes(2);
  expect(screen.queryByTestId('panorama-preview')).not.toBeInTheDocument();
});
