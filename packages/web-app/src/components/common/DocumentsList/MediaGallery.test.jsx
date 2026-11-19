import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import renderWithProviders from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';
import { createPanoramaViewer } from '@/components/common/PanoramaPreview/pannellum';
import DocumentsList from './DocumentsList';

vi.mock('@/components/common/PanoramaPreview/pannellum', () => ({
  createPanoramaViewer: vi.fn()
}));

it('preserves the per-file flag from a shared document gallery and opens only the selected original', async () => {
  createPanoramaViewer.mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn()
  });
  renderWithProviders(
    <MemoryRouter>
      <DocumentsList
        documents={[
          {
            id: 1,
            title: 'Gallery',
            files: [
              {
                id: 1,
                fileName: 'sphere.jpg',
                completePath: '/original.jpg',
                thumbnails: { small: '/thumb.webp' },
                isPanorama: true
              },
              {
                id: 2,
                fileName: 'flat.jpg',
                completePath: '/flat.jpg',
                isPanorama: false
              }
            ]
          }
        ]}
      />
    </MemoryRouter>,
    { messages }
  );
  expect(createPanoramaViewer).not.toHaveBeenCalled();
  expect(screen.getAllByTestId('panorama-thumbnail-badge')).toHaveLength(1);
  expect(
    screen.getByRole('button', { name: 'sphere.jpg' })
  ).toHaveAccessibleDescription(messages['panorama.view']);
  fireEvent.click(screen.getByRole('button', { name: 'sphere.jpg' }));
  await waitFor(() => expect(createPanoramaViewer).toHaveBeenCalled());
  expect(createPanoramaViewer.mock.calls[0][1].panorama).toBe('/original.jpg');
  fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
  expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
    'src',
    '/flat.jpg'
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('keeps mixed-gallery indexes aligned after sorting and across pagination', async () => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  const { container } = renderWithProviders(
    <MemoryRouter>
      <DocumentsList
        itemsPerPage={1}
        defaultSortOrder={DOCUMENT_SORT_ORDERS.TITLE}
        documents={[
          {
            id: 2,
            title: 'Z video',
            files: [{ fileName: 'z.mp4', completePath: '/z.mp4' }]
          },
          {
            id: 1,
            title: 'A gallery',
            files: [
              { fileName: 'a.jpg', completePath: '/a.jpg' },
              { fileName: 'a.webm', completePath: '/a.webm' }
            ]
          }
        ]}
      />
    </MemoryRouter>,
    { messages }
  );
  expect(container.querySelector('video')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Open video: a.webm' }));
  expect(screen.getByTestId('video-preview')).toHaveAttribute('src', '/a.webm');
  fireEvent.click(screen.getByRole('button', { name: 'Next media' }));
  expect(screen.getByTestId('video-preview')).toHaveAttribute('src', '/z.mp4');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Go to page 2' }));
  fireEvent.click(screen.getByRole('button', { name: 'Open video: z.mp4' }));
  expect(screen.getByTestId('video-preview')).toHaveAttribute('src', '/z.mp4');
});
