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
  {
    fileName: 'sphere.jpg',
    completePath: '/sphere.jpg',
    isPanorama: true,
    thumbnails: { small: '/thumb.jpg' }
  },
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
  await waitFor(() => expect(createPanoramaViewer).toHaveBeenCalled());
  return viewers.at(-1);
};

it('loads the original automatically only when opened and shows its thumbnail while loading', async () => {
  const { rerender } = render(lightbox(false));
  expect(createPanoramaViewer).not.toHaveBeenCalled();
  expect(screen.queryByTestId('panorama-preview')).not.toBeInTheDocument();
  rerender(lightbox());
  expect(screen.getByTestId('panorama-loading-preview')).toHaveAttribute(
    'src',
    '/thumb.jpg'
  );
  const viewer = await activate();
  expect(screen.getByRole('progressbar')).toHaveAccessibleName('Loading ...');
  expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  expect(createPanoramaViewer.mock.calls[0][1]).toMatchObject({
    panorama: '/sphere.jpg',
    type: 'equirectangular',
    autoLoad: true,
    showControls: false
  });
  expect(screen.queryByTestId('lightbox-image')).not.toBeInTheDocument();
  act(() => viewer.events.load());
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(
    screen.queryByTestId('panorama-loading-preview')
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(viewer.setHfov).toHaveBeenCalledWith(90);
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(viewer.lookAt).toHaveBeenCalledWith(0, 0, 100, false);

  fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
  expect(viewer.destroy).toHaveBeenCalledOnce();
  expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
    'src',
    '/flat.jpg'
  );
});

it('gives gestures and arrow keys to the panorama and selects the next viewer from its flag', async () => {
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
  expect(
    screen.queryByTestId('panorama-mode-controls')
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
  expect(
    screen.queryByTestId('panorama-mode-controls')
  ).not.toBeInTheDocument();
});

it('allows retry after an error and releases a pending viewer on close', async () => {
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

it.each(['ArrowRight', 'ArrowLeft'])(
  'keeps gallery navigation with %s outside the panorama viewer',
  async key => {
    render(lightbox());
    const viewer = await activate();
    act(() => viewer.events.load());
    fireEvent.keyDown(screen.getByTestId('lightbox-caption'), { key });
    expect(viewer.destroy).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('panorama-preview')).not.toBeInTheDocument();
    if (key === 'ArrowRight') {
      expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
        'src',
        '/flat.jpg'
      );
    } else {
      expect(screen.getByTestId('video-preview')).toBeInTheDocument();
    }
  }
);

it.each([false, undefined])(
  'uses the regular viewer when isPanorama is %s',
  isPanorama => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <MediaLightbox
          open
          onClose={() => {}}
          media={[{ ...media[0], isPanorama }]}
        />
      </IntlProvider>
    );
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
      'src',
      '/sphere.jpg'
    );
    expect(createPanoramaViewer).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId('panorama-mode-controls')
    ).not.toBeInTheDocument();
  }
);
