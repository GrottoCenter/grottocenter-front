import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import messages from '@/../public/lang/en.json';
import ModelPreview from './index';

// jsdom covers session/error lifecycle only. The browser tests load an actual
// GLB with the real engine to verify rendering and camera interactions.
vi.mock('./modelViewer', () => ({
  ModelViewerElement: { modelCacheSize: 5 }
}));

const MODEL_URL = 'https://models.example.org/scan.glb';
const POSTER_URL = 'https://models.example.org/thumbnail.webp';
const Wrapper = ({ children }) => (
  <IntlProvider locale="en" messages={messages}>
    {children}
  </IntlProvider>
);

const renderPreview = () =>
  render(
    <ModelPreview src={MODEL_URL} title="scan.glb" poster={POSTER_URL} />,
    { wrapper: Wrapper }
  );

const startPreview = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'View in 3D' }));
  await waitFor(() =>
    expect(screen.getByTestId('model-viewer').src).toBe(MODEL_URL)
  );
  return screen.getByTestId('model-viewer');
};

describe('ModelPreview sessions', () => {
  it('shows an optional image without creating a 3D viewer or controls', () => {
    renderPreview();
    expect(screen.getByTestId('model-preview-poster')).toHaveAttribute(
      'src',
      POSTER_URL
    );
    expect(screen.queryByTestId('model-viewer')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('model-preview-controls')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View in 3D' })).toBeEnabled();
  });

  it('falls back from a broken thumbnail and accepts a later API thumbnail', () => {
    const { rerender } = renderPreview();
    fireEvent.error(screen.getByTestId('model-preview-poster'));
    expect(
      screen.queryByTestId('model-preview-poster')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View in 3D' })).toBeEnabled();

    rerender(
      <ModelPreview
        src={MODEL_URL}
        title="scan.glb"
        poster="https://models.example.org/new-thumbnail.webp"
      />
    );
    expect(screen.getByTestId('model-preview-poster')).toHaveAttribute(
      'src',
      'https://models.example.org/new-thumbnail.webp'
    );
    expect(screen.queryByTestId('model-viewer')).not.toBeInTheDocument();
  });

  it('starts a new idle session when API data changes the model URL', async () => {
    const { rerender } = renderPreview();
    const viewer = await startPreview();
    fireEvent.load(viewer);
    fireEvent.click(screen.getByRole('button', { name: 'Dark background' }));

    rerender(
      <ModelPreview
        src="https://models.example.org/other.glb"
        title="other.glb"
      />
    );
    expect(screen.getByTestId('model-preview')).toHaveAttribute(
      'data-status',
      'idle'
    );
    expect(screen.getByTestId('model-preview-frame')).toHaveAttribute(
      'data-background',
      'light'
    );
    expect(screen.queryByTestId('model-viewer')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('model-preview-controls')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('model-preview-poster')
    ).not.toBeInTheDocument();
  });

  it('retries a failed URL without accepting events from the old viewer', async () => {
    renderPreview();
    const firstViewer = await startPreview();
    fireEvent.error(firstViewer);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to display this 3D model.'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => {
      const retryViewer = screen.getByTestId('model-viewer');
      expect(retryViewer).not.toBe(firstViewer);
      expect(
        new URL(retryViewer.src).searchParams.has('modelPreviewRetry')
      ).toBe(true);
    });
    fireEvent.load(firstViewer);
    expect(screen.getByTestId('model-preview')).toHaveAttribute(
      'data-status',
      'loading'
    );
    fireEvent.load(screen.getByTestId('model-viewer'));
    expect(screen.getByTestId('model-preview')).toHaveAttribute(
      'data-status',
      'ready'
    );
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled();
  });
});
