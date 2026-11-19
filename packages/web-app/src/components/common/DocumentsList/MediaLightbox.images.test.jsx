import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import MediaLightbox from './MediaLightbox';

const messages = {
  Image: 'Image',
  'panorama.view': '360° view',
  Close: 'Close',
  Download: 'Download',
  'Hide image caption': 'Hide image caption',
  'Image {current} of {total}': 'Image {current} of {total}',
  'Loading ...': 'Loading ...',
  'Next image': 'Next image',
  'Previous image': 'Previous image',
  'Reset zoom': 'Reset zoom',
  'Show image caption': 'Show image caption'
};

const images = [
  {
    fileName: 'first.jpg',
    completePath: '/first.jpg',
    thumbnails: { large: '/thumbnails/large/first.webp' },
    description: 'First description',
    documentTitle: 'First title'
  },
  {
    fileName: 'second.jpg',
    completePath: '/second.jpg',
    thumbnails: { large: '/thumbnails/large/second.webp' },
    description: 'Second description',
    documentTitle: 'Second title'
  }
];

const viewer = (open = true) => (
  <IntlProvider locale="en" messages={messages}>
    <MediaLightbox open={open} onClose={() => {}} media={images} />
  </IntlProvider>
);

const renderLightbox = () => render(viewer());

const loadImage = (image, width, height) => {
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: width },
    naturalHeight: { configurable: true, value: height }
  });
  fireEvent.load(image);
};

afterEach(() => vi.restoreAllMocks());

describe('MediaLightbox original images', () => {
  it('keeps the image mounted until the dialog exit transition finishes', async () => {
    const { rerender } = renderLightbox();
    const image = screen.getByTestId('lightbox-image');
    rerender(viewer(false));
    expect(image).toBeInTheDocument();
    await waitForElementToBeRemoved(image);
  });

  it('loads only the active original and keeps its source while zooming', () => {
    renderLightbox();

    const image = screen.getByRole('img', { name: 'first.jpg' });
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(image).toHaveAttribute('src', '/first.jpg');
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('Loading ...');

    fireEvent.load(image);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(image).toHaveStyle({ opacity: '1' });

    fireEvent.wheel(image, { deltaY: -100 });
    expect(image).toHaveAttribute('src', '/first.jpg');
    expect(image.style.transform).toContain('scale(1.2)');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset zoom' }));
    expect(image).toHaveAttribute('src', '/first.jpg');
    expect(image.style.transform).toContain('scale(1)');
  });

  it('shows loading for each active original when navigating', () => {
    renderLightbox();
    fireEvent.load(screen.getByRole('img', { name: 'first.jpg' }));

    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    const secondImage = screen.getByRole('img', { name: 'second.jpg' });
    expect(secondImage).toHaveAttribute('src', '/second.jpg');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(secondImage).toHaveStyle({ opacity: '0' });

    fireEvent.load(secondImage);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    fireEvent.load(screen.getByRole('img', { name: 'first.jpg' }));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('clears the loading indicator if the original fails to load', () => {
    renderLightbox();
    fireEvent.error(screen.getByRole('img', { name: 'first.jpg' }));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('resets mouse panning and zoom on navigation and an interrupted close', () => {
    const { rerender } = renderLightbox();
    const image = screen.getByTestId('lightbox-image');
    const stage = screen.getByTestId('lightbox-image-stage');
    fireEvent.wheel(image, { deltaY: -100 });
    fireEvent.mouseDown(stage, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(stage, { clientX: 160, clientY: 130 });
    expect(image.style.transform).toContain('translate(50px, 25px)');

    fireEvent.keyDown(stage, { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByTestId('lightbox-image-stage'), {
      key: 'ArrowLeft'
    });
    const restored = screen.getByTestId('lightbox-image');
    expect(restored.style.transform).toContain('scale(1) translate(0px, 0px)');
    fireEvent.mouseMove(screen.getByTestId('lightbox-image-stage'), {
      clientX: 200,
      clientY: 200
    });
    expect(restored.style.transform).toContain('translate(0px, 0px)');

    fireEvent.wheel(restored, { deltaY: -100 });
    rerender(viewer(false));
    rerender(viewer());
    expect(screen.getByTestId('lightbox-image').style.transform).toContain(
      'scale(1) translate(0px, 0px)'
    );
  });

  it('preserves pinch zoom, touch panning and double-tap reset', () => {
    renderLightbox();
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    const image = screen.getByTestId('lightbox-image');
    const stage = screen.getByTestId('lightbox-image-stage');
    fireEvent.touchStart(stage, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 }
      ]
    });
    fireEvent.touchMove(stage, {
      touches: [
        { clientX: 0, clientY: 0 },
        { clientX: 200, clientY: 0 }
      ]
    });
    fireEvent.touchEnd(stage, { changedTouches: [{}, {}], touches: [] });
    expect(image.style.transform).toContain('scale(2)');

    fireEvent.touchStart(stage, {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    fireEvent.touchMove(stage, {
      touches: [{ clientX: 140, clientY: 120 }]
    });
    expect(image.style.transform).toContain('translate(20px, 10px)');
    fireEvent.touchEnd(stage, { changedTouches: [{}], touches: [] });

    // Keep the double tap separate from the preceding drag, with stable timing.
    now.mockReturnValue(1500);
    fireEvent.touchStart(stage, {
      touches: [{ clientX: 140, clientY: 120 }]
    });
    fireEvent.touchEnd(stage, { changedTouches: [{}], touches: [] });
    now.mockReturnValue(1600);
    fireEvent.touchStart(stage, {
      touches: [{ clientX: 140, clientY: 120 }]
    });
    fireEvent.touchEnd(stage, { changedTouches: [{}], touches: [] });
    expect(image.style.transform).toContain('scale(1) translate(0px, 0px)');
  });
});

describe('MediaLightbox image backing', () => {
  it('does not reuse the previous image dimensions while navigating', () => {
    renderLightbox();
    const firstImage = screen.getByTestId('lightbox-image');
    loadImage(firstImage, 800, 400);
    expect(firstImage).toHaveStyle({
      backgroundColor: '#fff',
      width: 'min(100cqw, 200cqh)',
      height: 'min(100cqh, 50cqw)'
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    const image = screen.getByTestId('lightbox-image');

    expect(image).toHaveAttribute('src', '/second.jpg');
    expect(image).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0)' });
    loadImage(image, 400, 800);
    expect(image).toHaveStyle({
      backgroundColor: '#fff',
      width: 'min(100cqw, 50cqh)',
      height: 'min(100cqh, 200cqw)'
    });
  });
});

describe('MediaLightbox image captions', () => {
  it('hides the caption while keeping the image counter available', () => {
    renderLightbox();

    const hideButton = screen.getByRole('button', {
      name: 'Hide image caption'
    });
    const caption = document.getElementById(
      hideButton.getAttribute('aria-controls')
    );

    expect(hideButton).toHaveAttribute('aria-expanded', 'true');
    expect(caption).toHaveAttribute('aria-hidden', 'false');
    expect(caption).toHaveTextContent('First description');

    fireEvent.click(hideButton);

    const showButton = screen.getByRole('button', {
      name: 'Show image caption'
    });
    expect(showButton).toHaveAttribute('aria-expanded', 'false');
    expect(caption).toHaveAttribute('aria-hidden', 'true');

    const counters = screen.getAllByText('Image 1 of 2');
    expect(counters.some(counter => !caption.contains(counter))).toBe(true);
  });

  it('keeps the caption hidden while navigating between images', () => {
    renderLightbox();

    fireEvent.click(screen.getByRole('button', { name: 'Hide image caption' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));

    expect(
      screen.getByRole('button', { name: 'Show image caption' })
    ).toHaveAttribute('aria-expanded', 'false');

    const showButton = screen.getByRole('button', {
      name: 'Show image caption'
    });
    const caption = document.getElementById(
      showButton.getAttribute('aria-controls')
    );
    const counters = screen.getAllByText('Image 2 of 2');

    expect(counters.some(counter => !caption.contains(counter))).toBe(true);
  });
});
