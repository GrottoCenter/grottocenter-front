import { cleanup, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import renderWithProviders from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';
import DocumentsList from './DocumentsList';

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
