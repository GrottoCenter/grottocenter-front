import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ImageLightbox from './ImageLightbox';

const messages = {
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

const renderLightbox = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <ImageLightbox open onClose={() => {}} images={images} />
    </IntlProvider>
  );

const loadImage = (image, width, height) => {
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: width },
    naturalHeight: { configurable: true, value: height }
  });
  fireEvent.load(image);
};

describe('ImageLightbox original images', () => {
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
});

describe('ImageLightbox image backing', () => {
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

describe('ImageLightbox captions', () => {
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
