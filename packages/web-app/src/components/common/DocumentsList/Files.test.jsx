import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Files from './Files';

vi.mock('./ImageLightbox', () => ({ default: () => null }));

const modelFile = {
  fileName: 'cave-scan.GLB',
  completePath: 'https://files.example.org/cave-scan.glb'
};
const documentUrl = '/ui/documents/42';

const renderFiles = ({ files, onImageClick, imageIndexOffset }) =>
  render(
    <MemoryRouter>
      <Files
        documentUrl={documentUrl}
        files={files}
        onImageClick={onImageClick}
        imageIndexOffset={imageIndexOffset}
      />
    </MemoryRouter>
  );

describe('Document file thumbnails', () => {
  it.each(['small', 'medium', 'large'])(
    'links a model %s thumbnail to its document and keeps the download link',
    size => {
      const thumbnailUrl = `https://files.example.org/${size}/cave-scan.webp`;
      renderFiles({
        files: [{ ...modelFile, thumbnails: { [size]: thumbnailUrl } }]
      });

      const thumbnail = screen.getByRole('img', { name: modelFile.fileName });
      expect(thumbnail).toHaveAttribute('src', thumbnailUrl);
      expect(thumbnail).toHaveAttribute(
        'srcset',
        expect.stringContaining(size)
      );
      expect(thumbnail).toHaveAttribute('loading', 'lazy');
      expect(thumbnail).toHaveStyle({ objectFit: 'contain' });
      expect(thumbnail.closest('a')).toHaveAttribute('href', documentUrl);
      expect(thumbnail.closest('a')).not.toHaveAttribute('role', 'button');
      expect(screen.getByText(modelFile.fileName).closest('a')).toHaveAttribute(
        'href',
        modelFile.completePath
      );
    }
  );

  it.each([undefined, null, { small: null, medium: null, large: null }])(
    'keeps models without thumbnails as download links without requesting an image',
    thumbnails => {
      renderFiles({ files: [{ ...modelFile, thumbnails }] });

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: modelFile.fileName })
      ).toHaveAttribute('href', modelFile.completePath);
    }
  );

  it('keeps image lightbox indexes independent of model thumbnails', () => {
    const onImageClick = vi.fn();
    renderFiles({
      files: [
        {
          ...modelFile,
          thumbnails: { small: 'https://files.example.org/cave-scan.webp' }
        },
        { fileName: 'plan.png', completePath: '/plan.png' },
        { fileName: 'section.png', completePath: '/section.png' }
      ],
      onImageClick,
      imageIndexOffset: 4
    });

    fireEvent.click(screen.getByRole('button', { name: 'section.png' }));
    expect(onImageClick).toHaveBeenCalledExactlyOnceWith(5);
    fireEvent.click(screen.getByRole('button', { name: 'plan.png' }));
    expect(onImageClick).toHaveBeenLastCalledWith(4);
    expect(
      screen.getByRole('img', { name: modelFile.fileName }).closest('a')
    ).toHaveAttribute('href', documentUrl);
  });

  it('keeps the document link accessible if a model thumbnail fails to load', () => {
    renderFiles({
      files: [
        {
          ...modelFile,
          thumbnails: { small: 'https://files.example.org/missing.webp' }
        }
      ]
    });

    fireEvent.error(screen.getByRole('img', { name: modelFile.fileName }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: modelFile.fileName })
    ).toHaveLength(2);
  });
});
