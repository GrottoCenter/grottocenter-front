import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import Files from './Files';

vi.mock('./MediaLightbox', () => ({ default: () => null }));

const modelFile = {
  fileName: 'cave-scan.GLB',
  completePath: 'https://files.example.org/cave-scan.glb'
};
const documentUrl = '/ui/documents/42';

const renderFiles = ({ files, onMediaClick, mediaIndexOffset }) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <MemoryRouter>
        <Files
          documentUrl={documentUrl}
          files={files}
          onMediaClick={onMediaClick}
          mediaIndexOffset={mediaIndexOffset}
        />
      </MemoryRouter>
    </IntlProvider>
  );

describe('Document file thumbnails', () => {
  it('keeps glTF download-only even when the API provides a thumbnail', () => {
    const file = {
      fileName: 'terrain.gltf',
      completePath: 'https://files.example.org/terrain.gltf',
      thumbnails: { small: 'https://files.example.org/terrain.webp' }
    };
    renderFiles({ files: [file] });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: file.fileName })).toHaveAttribute(
      'href',
      file.completePath
    );
  });

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
    const onMediaClick = vi.fn();
    renderFiles({
      files: [
        {
          ...modelFile,
          thumbnails: { small: 'https://files.example.org/cave-scan.webp' }
        },
        { fileName: 'plan.png', completePath: '/plan.png' },
        { fileName: 'section.png', completePath: '/section.png' }
      ],
      onMediaClick,
      mediaIndexOffset: 4
    });

    fireEvent.click(screen.getByRole('button', { name: 'section.png' }));
    expect(onMediaClick).toHaveBeenCalledExactlyOnceWith(5);
    fireEvent.click(screen.getByRole('button', { name: 'plan.png' }));
    expect(onMediaClick).toHaveBeenLastCalledWith(4);
    expect(
      screen.getByRole('img', { name: modelFile.fileName }).closest('a')
    ).toHaveAttribute('href', documentUrl);
  });

  it.each(['MP4', 'avi', 'mpeg', 'webm', 'ogv'])(
    'opens %s videos in file order without requesting the video as an image',
    extension => {
      const onMediaClick = vi.fn();
      const video = {
        fileName: `video.${extension}`,
        completePath: `/video.${extension}`
      };
      const { container } = renderFiles({
        files: [
          { fileName: 'plan.png', completePath: '/plan.png' },
          video,
          { fileName: 'animation.gif', completePath: '/animation.gif' }
        ],
        onMediaClick,
        mediaIndexOffset: 4
      });
      const button = screen.getByRole('button', {
        name: `Open video: ${video.fileName}`
      });
      expect(button.querySelector('img')).toBeNull();
      expect(container.querySelector('video')).toBeNull();
      expect(screen.queryByRole('link', { name: video.fileName })).toBeNull();
      expect(screen.queryByText(video.fileName)).not.toBeInTheDocument();
      fireEvent.click(button);
      expect(onMediaClick).toHaveBeenLastCalledWith(5);
      fireEvent.click(screen.getByRole('button', { name: 'animation.gif' }));
      expect(onMediaClick).toHaveBeenLastCalledWith(6);
    }
  );

  it('uses a video poster and falls back to a clickable tile if it fails', () => {
    const onMediaClick = vi.fn();
    renderFiles({
      files: [
        {
          fileName: 'video.mp4',
          completePath: '/video.mp4',
          thumbnails: { medium: '/poster.webp' }
        }
      ],
      onMediaClick
    });
    const poster = screen.getByRole('img', { name: 'video.mp4' });
    expect(poster).toHaveAttribute('src', '/poster.webp');
    expect(screen.queryByText('video.mp4')).not.toBeInTheDocument();
    fireEvent.error(poster);
    expect(screen.queryByText('video.mp4')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Open video: video.mp4' })
    );
    expect(onMediaClick).toHaveBeenCalledExactlyOnceWith(0);
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
