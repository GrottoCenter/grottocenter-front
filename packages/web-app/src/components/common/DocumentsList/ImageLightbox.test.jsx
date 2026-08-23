import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ImageLightbox from './ImageLightbox';

const messages = {
  Close: 'Close',
  Download: 'Download',
  'Hide image caption': 'Hide image caption',
  'Image {current} of {total}': 'Image {current} of {total}',
  'Next image': 'Next image',
  'Previous image': 'Previous image',
  'Show image caption': 'Show image caption'
};

const images = [
  {
    fileName: 'first.jpg',
    completePath: '/first.jpg',
    description: 'First description',
    documentTitle: 'First title'
  },
  {
    fileName: 'second.jpg',
    completePath: '/second.jpg',
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
