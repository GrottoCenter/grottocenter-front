import { fireEvent, render, screen } from '@testing-library/react';
import FileImage from './FileImage';

it.each([undefined, { small: '/thumb.webp' }])(
  'keeps a panorama placeholder without an original fallback (%s)',
  thumbnails => {
    const onUnavailable = vi.fn();
    const { container } = render(
      <FileImage
        file={{
          fileName: 'sphere.jpg',
          isPanorama: true,
          completePath: '/original.jpg',
          thumbnails
        }}
        alt="Cave"
        sizes="128px"
        onUnavailable={onUnavailable}
      />
    );
    const thumbnail = container.querySelector('img');
    if (thumbnail) fireEvent.error(thumbnail);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Cave' })).toBeInTheDocument();
    expect(onUnavailable).not.toHaveBeenCalled();
  }
);
